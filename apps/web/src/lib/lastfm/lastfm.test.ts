import { lastfmId, splitRecentTracks, toArtist, toImages, toTopTrack, toUser } from "./adapter";
import { buildLastfmUrl, kindFromLastfmError, lastfmFetch } from "./client";
import { pickGenreTags, withLastfmGenres } from "./tags";
import type { LastfmRecentTrack } from "./types";

const originalFetch = global.fetch;
const originalKey = process.env.LASTFM_API_KEY;

beforeEach(() => {
  process.env.LASTFM_API_KEY = "test-key";
});

afterEach(() => {
  global.fetch = originalFetch;
  process.env.LASTFM_API_KEY = originalKey;
  jest.restoreAllMocks();
});

const image = (size: "small" | "large" | "extralarge", url: string) => ({ "#text": url, size });
const PLACEHOLDER = "https://lastfm.freetls.fastly.net/i/u/300x300/2a96cbd8b46e442fc41c2b86b821562f.png";

describe("adapter Last.fm → tipos da UI", () => {
  it("descarta a imagem genérica (estrela) e converte tamanhos", () => {
    expect(toImages([image("small", PLACEHOLDER), image("large", "https://x/cover.jpg"), image("extralarge", "")])).toEqual([
      { url: "https://x/cover.jpg", width: 174, height: 174 },
    ]);
  });

  it("gera ids estáveis a partir dos nomes", () => {
    expect(lastfmId("Legião Urbana", "Índios")).toBe("legiao-urbana-indios");
  });

  it("converte usuário, artista e top track (com playcount e duração)", () => {
    expect(toUser({ name: "doug", realname: "", url: "https://last.fm/user/doug" })).toMatchObject({ id: "doug", display_name: "doug" });

    const artist = toArtist({ name: "Gojira", playcount: "1234", url: "https://last.fm/music/Gojira", image: [image("large", PLACEHOLDER)] });
    expect(artist).toMatchObject({ id: "gojira", name: "Gojira", playcount: 1234, images: [], genres: [] });
    expect(artist.external_urls.lastfm).toBe("https://last.fm/music/Gojira");

    const track = toTopTrack({
      name: "Stranded",
      playcount: "42",
      duration: "272",
      url: "https://last.fm/music/Gojira/_/Stranded",
      artist: { name: "Gojira", url: "https://last.fm/music/Gojira" },
    });
    expect(track).toMatchObject({ name: "Stranded", playcount: 42, duration_ms: 272_000, album: { name: "" } });
    expect(track.artists[0]).toMatchObject({ id: "gojira", name: "Gojira" });
  });

  it("separa o 'tocando agora' do histórico e aceita item único (objeto)", () => {
    const playing: LastfmRecentTrack = {
      name: "Now",
      url: "u",
      artist: { "#text": "A" },
      album: { "#text": "Album" },
      "@attr": { nowplaying: "true" },
    };
    const played: LastfmRecentTrack = { name: "Before", url: "u", artist: { "#text": "B" }, album: { "#text": "" }, date: { uts: "1790000000", "#text": "" } };

    const result = splitRecentTracks([playing, played]);
    expect(result.nowPlaying).toMatchObject({ isPlaying: true, durationMs: 0, track: { name: "Now", album: { name: "Album" } } });
    expect(result.history).toEqual([expect.objectContaining({ played_at: new Date(1_790_000_000_000).toISOString() })]);

    expect(splitRecentTracks(played).history).toHaveLength(1);
    expect(splitRecentTracks(undefined)).toEqual({ nowPlaying: null, history: [] });
  });
});

describe("tags → gêneros", () => {
  it("ignora ruído, o nome do artista, tags fracas e duplicadas", () => {
    const tags = [
      { name: "seen live", count: 100 },
      { name: "Progressive Metal", count: 100 },
      { name: "gojira", count: 90 },
      { name: "french", count: 80 },
      { name: "progressive metal", count: 70 },
      { name: "Death Metal", count: 60 },
      { name: "groove metal", count: 40 },
      { name: "technical death metal", count: 5 },
    ];
    expect(pickGenreTags(tags, "Gojira")).toEqual(["progressive metal", "death metal", "groove metal"]);
  });

  it("preenche só artistas sem gênero e tolera falhas individuais", async () => {
    global.fetch = jest.fn(async (url: string) => {
      if (url.includes("artist=Broken")) return new Response(JSON.stringify({ error: 6, message: "not found" }));
      return new Response(JSON.stringify({ toptags: { tag: [{ name: "rock", count: 100 }] } }));
    }) as unknown as typeof fetch;

    const result = await withLastfmGenres([
      { id: "a", name: "Has", genres: ["jazz"], images: [], external_urls: {} },
      { id: "b", name: "Needs", genres: [], images: [], external_urls: {} },
      { id: "c", name: "Broken", images: [], external_urls: {} },
    ]);

    expect(result.map((artist) => artist.genres)).toEqual([["jazz"], ["rock"], []]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});

describe("client", () => {
  it("monta a URL com método, parâmetros, chave e formato", () => {
    const url = new URL(buildLastfmUrl("user.gettopartists", { user: "doug", period: "1month", limit: undefined }, "k"));
    expect(Object.fromEntries(url.searchParams)).toEqual({ method: "user.gettopartists", user: "doug", period: "1month", api_key: "k", format: "json" });
  });

  it.each([
    [6, "not_found"],
    [17, "forbidden"],
    [29, "rate_limited"],
    [16, "unavailable"],
    [10, "unknown"],
  ])("erro %i do Last.fm vira '%s'", (code, kind) => {
    expect(kindFromLastfmError(code)).toBe(kind);
  });

  it("erro no corpo (mesmo com HTTP 200) vira SpotifyApiError", async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response(JSON.stringify({ error: 6, message: "User not found" })));
    await expect(lastfmFetch("user.getinfo", { user: "nobody" })).rejects.toMatchObject({ kind: "not_found" });
  });

  it("sem LASTFM_API_KEY não faz requisição", async () => {
    delete process.env.LASTFM_API_KEY;
    global.fetch = jest.fn();
    await expect(lastfmFetch("user.getinfo", { user: "x" })).rejects.toThrow(/LASTFM_API_KEY/);
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
