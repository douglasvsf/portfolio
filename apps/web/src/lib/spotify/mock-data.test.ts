import { TIME_RANGES } from "@/config/spotify";
import { mockCurrentlyPlaying, mockRecentlyPlayed, mockTopArtists, mockTopTracks } from "./mock-data";

const ranges = [...TIME_RANGES];

describe("modo demo", () => {
  it("cada período tem um ranking próprio e estável", () => {
    const leaders = ranges.map((range) => mockTopArtists(range, 1)[0].id);
    expect(new Set(leaders).size).toBe(ranges.length);
    expect(mockTopArtists("short_term", 5)).toEqual(mockTopArtists("short_term", 5));
  });

  it("respeita o limite e não repete itens", () => {
    for (const range of ranges) {
      const tracks = mockTopTracks(range, 20);
      expect(tracks).toHaveLength(20);
      expect(new Set(tracks.map((track) => track.id)).size).toBe(20);
    }
  });

  it("histórico recente é relativo ao momento atual e decrescente", () => {
    const now = Date.parse("2026-09-24T12:00:00Z");
    const items = mockRecentlyPlayed(50, now);
    expect(items).toHaveLength(50);
    const times = items.map((item) => Date.parse(item.played_at));
    expect(times[0]).toBeLessThan(now);
    expect([...times].sort((a, b) => b - a)).toEqual(times);
  });

  it("'now playing' avança com o relógio sem passar da duração", () => {
    const playing = mockCurrentlyPlaying(1_000_000);
    expect(playing.is_playing).toBe(true);
    expect(playing.progress_ms).toBeLessThan(playing.item!.duration_ms);
  });
});
