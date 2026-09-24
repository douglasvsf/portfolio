import {
  artistsInTopTracks,
  formatDuration,
  genreDistribution,
  groupByDay,
  musicProfile,
  normalizeGenre,
  normalizeNowPlaying,
  pickImage,
} from "./transform";
import type { CurrentlyPlaying, RecentlyPlayedItem, SpotifyArtist, SpotifyTrack } from "./types";

const artist = (id: string, genres?: string[]): SpotifyArtist => ({
  id,
  name: id.toUpperCase(),
  genres,
  images: [],
  external_urls: {},
});

const track = (id: string, artistIds: string[], durationMs = 200_000): SpotifyTrack => ({
  id,
  name: `Track ${id}`,
  duration_ms: durationMs,
  explicit: false,
  album: { id: `album-${id}`, name: `Album ${id}`, images: [], external_urls: {} },
  artists: artistIds.map((artistId) => ({ id: artistId, name: artistId.toUpperCase(), external_urls: {} })),
  external_urls: {},
});

describe("normalizeGenre", () => {
  it("padroniza caixa e espaços", () => {
    expect(normalizeGenre("  progressive   metal ")).toBe("Progressive Metal");
    expect(normalizeGenre("HIP HOP")).toBe("Hip Hop");
  });
});

describe("genreDistribution", () => {
  it("conta cada gênero uma vez por artista e ordena do mais comum para o menos comum", () => {
    const result = genreDistribution([
      artist("a", ["rock", "metal"]),
      artist("b", ["rock", "Rock"]), // duplicado no mesmo artista conta uma vez
      artist("c", ["pop"]),
      artist("d"), // sem gêneros (Development Mode) não quebra
    ]);

    expect(result).toEqual([
      { genre: "Rock", artists: 2, share: 0.5 },
      { genre: "Metal", artists: 1, share: 0.25 },
      { genre: "Pop", artists: 1, share: 0.25 },
    ]);
  });

  it("respeita o limite e devolve vazio quando não há dados", () => {
    expect(genreDistribution([artist("a", ["a", "b", "c"])], 2)).toHaveLength(2);
    expect(genreDistribution([])).toEqual([]);
  });
});

describe("artistsInTopTracks", () => {
  it("conta faixas por artista, incluindo participações", () => {
    const result = artistsInTopTracks([track("1", ["x"]), track("2", ["x", "y"]), track("3", ["y"]), track("4", ["z"])]);
    expect(result).toEqual([
      { artist: "X", tracks: 2 },
      { artist: "Y", tracks: 2 },
      { artist: "Z", tracks: 1 },
    ]);
  });
});

describe("musicProfile", () => {
  it("resume artistas, faixas e gêneros", () => {
    const profile = musicProfile([artist("a", ["rock"]), artist("b", ["rock", "jazz"])], [track("1", ["a"], 180_000), track("2", ["b"], 240_000)]);
    expect(profile).toMatchObject({
      artistsAnalyzed: 2,
      tracksAnalyzed: 2,
      genresDiscovered: 2,
      topGenre: "Rock",
      averageTrackMs: 210_000,
    });
    expect(profile.topArtist?.id).toBe("a");
    expect(profile.topTrack?.id).toBe("1");
  });

  it("lida com respostas vazias", () => {
    expect(musicProfile([], [])).toEqual({
      artistsAnalyzed: 0,
      tracksAnalyzed: 0,
      genresDiscovered: 0,
      topGenre: null,
      topArtist: null,
      topTrack: null,
      averageTrackMs: null,
    });
  });
});

describe("normalizeNowPlaying", () => {
  const base: CurrentlyPlaying = {
    is_playing: true,
    progress_ms: 30_000,
    timestamp: 0,
    currently_playing_type: "track",
    item: track("1", ["a"], 100_000),
  };

  it("normaliza uma faixa tocando", () => {
    expect(normalizeNowPlaying(base)).toMatchObject({ isPlaying: true, progressMs: 30_000, durationMs: 100_000 });
  });

  it("retorna null quando nada toca, em anúncios ou podcasts", () => {
    expect(normalizeNowPlaying(null)).toBeNull();
    expect(normalizeNowPlaying({ ...base, currently_playing_type: "ad", item: null })).toBeNull();
    expect(normalizeNowPlaying({ ...base, currently_playing_type: "episode" })).toBeNull();
  });

  it("nunca deixa o progresso passar da duração", () => {
    expect(normalizeNowPlaying({ ...base, progress_ms: 999_999 })?.progressMs).toBe(100_000);
  });
});

describe("groupByDay", () => {
  it("agrupa por dia no fuso informado, mais recente primeiro", () => {
    const items: RecentlyPlayedItem[] = [
      { track: track("1", ["a"]), played_at: "2026-09-23T23:30:00.000Z" },
      { track: track("2", ["a"]), played_at: "2026-09-24T01:00:00.000Z" },
      { track: track("3", ["a"]), played_at: "2026-09-24T12:00:00.000Z" },
    ];
    // Em São Paulo (UTC-3), 01:00Z do dia 24 ainda é dia 23.
    const days = groupByDay(items, "America/Sao_Paulo");
    expect(days.map((day) => [day.day, day.items.map((item) => item.track.id)])).toEqual([
      ["2026-09-24", ["3"]],
      ["2026-09-23", ["2", "1"]],
    ]);
  });
});

describe("formatação", () => {
  it("formatDuration", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(65_000)).toBe("1:05");
    expect(formatDuration(515_999)).toBe("8:35");
  });

  it("pickImage escolhe a menor imagem que cobre o tamanho pedido", () => {
    const images = [
      { url: "640", width: 640, height: 640 },
      { url: "300", width: 300, height: 300 },
      { url: "64", width: 64, height: 64 },
    ];
    expect(pickImage(images, 100)).toBe("300");
    expect(pickImage(images, 1000)).toBe("640");
    expect(pickImage([], 100)).toBeNull();
  });
});
