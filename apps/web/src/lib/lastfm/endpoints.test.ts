import { getRecentTracks, getTopArtists, getTopTracks, getUserInfo } from "./endpoints";

const originalFetch = global.fetch;
const originalKey = process.env.LASTFM_API_KEY;

beforeEach(() => {
  process.env.LASTFM_API_KEY = "key";
});

afterEach(() => {
  global.fetch = originalFetch;
  process.env.LASTFM_API_KEY = originalKey;
});

const respond = (body: unknown) => {
  const fetchMock = jest.fn(async () => new Response(JSON.stringify(body)));
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
};
const params = (fetchMock: jest.Mock) => Object.fromEntries(new URL(fetchMock.mock.calls[0][0]).searchParams);

describe("endpoints do Last.fm", () => {
  it("perfil: usa o nome real quando existe", async () => {
    respond({ user: { name: "rj", realname: "Richard", url: "https://last.fm/user/rj" } });
    await expect(getUserInfo("rj")).resolves.toMatchObject({ id: "rj", display_name: "Richard" });
  });

  it("top artistas e músicas usam o período equivalente do Last.fm", async () => {
    let fetchMock = respond({ topartists: { artist: [{ name: "Green Day", playcount: "271", url: "u" }] } });
    await expect(getTopArtists("rj", "short_term", 10)).resolves.toEqual([expect.objectContaining({ name: "Green Day", playcount: 271 })]);
    expect(params(fetchMock)).toMatchObject({ method: "user.gettopartists", user: "rj", period: "1month", limit: "10" });

    fetchMock = respond({ toptracks: { track: [] } });
    await expect(getTopTracks("rj", "long_term")).resolves.toEqual([]);
    expect(params(fetchMock)).toMatchObject({ method: "user.gettoptracks", period: "12month" });
  });

  it("histórico recente separa o que está tocando agora", async () => {
    respond({
      recenttracks: {
        track: [
          { name: "Agora", url: "u", artist: { "#text": "A" }, album: { "#text": "" }, "@attr": { nowplaying: "true" } },
          { name: "Antes", url: "u", artist: { "#text": "B" }, album: { "#text": "X" }, date: { uts: "1790000000", "#text": "" } },
        ],
      },
    });
    const result = await getRecentTracks("rj");
    expect(result.nowPlaying?.track.name).toBe("Agora");
    expect(result.history.map((item) => item.track.name)).toEqual(["Antes"]);
  });

  it("lista vazia ou com 1 item só (objeto) é normalizada", async () => {
    respond({ topartists: {} });
    await expect(getTopArtists("rj", "medium_term")).resolves.toEqual([]);
    respond({ topartists: { artist: { name: "Solo", playcount: 3, url: "u" } } });
    await expect(getTopArtists("rj", "medium_term")).resolves.toEqual([expect.objectContaining({ name: "Solo", playcount: 3 })]);
  });

  it("resposta sem o envelope esperado quebra o contrato", async () => {
    respond({});
    await expect(getTopArtists("rj", "medium_term")).rejects.toMatchObject({ kind: "invalid_response" });
  });
});
