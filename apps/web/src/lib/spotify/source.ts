import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { RECENTLY_PLAYED_LIMIT, TOP_LIMIT } from "@/config/spotify";
import { getSpotifyConfig, isSpotifyConfigured, refreshAccessToken } from "./auth";
import * as api from "./endpoints";
import { DEMO_COOKIE, SESSION_COOKIE, isExpiring, sessionFromToken, unsealSession } from "./session";
import * as mock from "./mock-data";
import { normalizeNowPlaying, type NowPlaying } from "./transform";
import type { RecentlyPlayedItem, SpotifyArtist, SpotifyTrack, SpotifyUser, TimeRange } from "./types";

/**
 * Fonte de dados da UI. As páginas não sabem se estão falando com a Spotify
 * real ou com o modo demo — só chamam `getSpotifySource()`.
 */
export interface SpotifySource {
  mode: "live" | "demo";
  getProfile(): Promise<SpotifyUser | null>;
  getTopArtists(range: TimeRange, limit?: number): Promise<SpotifyArtist[]>;
  getTopTracks(range: TimeRange, limit?: number): Promise<SpotifyTrack[]>;
  getRecentlyPlayed(limit?: number): Promise<RecentlyPlayedItem[]>;
  getNowPlaying(): Promise<NowPlaying | null>;
}

export const demoSource: SpotifySource = {
  mode: "demo",
  getProfile: async () => mock.mockUser,
  getTopArtists: async (range, limit = TOP_LIMIT) => mock.mockTopArtists(range, limit),
  getTopTracks: async (range, limit = TOP_LIMIT) => mock.mockTopTracks(range, limit),
  getRecentlyPlayed: async (limit = RECENTLY_PLAYED_LIMIT) => mock.mockRecentlyPlayed(limit),
  getNowPlaying: async () => normalizeNowPlaying(mock.mockCurrentlyPlaying()),
};

export function liveSource(accessToken: string): SpotifySource {
  return {
    mode: "live",
    getProfile: () => api.getCurrentUser(accessToken),
    getTopArtists: (range, limit) => api.getTopArtists(accessToken, range, limit),
    getTopTracks: (range, limit) => api.getTopTracks(accessToken, range, limit),
    getRecentlyPlayed: (limit) => api.getRecentlyPlayed(accessToken, limit),
    getNowPlaying: async () => normalizeNowPlaying(await api.getCurrentlyPlaying(accessToken)),
  };
}

/** `MOCK_MODE=true` força o demo para todo mundo (útil em preview/CI). */
export const isForcedMockMode = () => process.env.MOCK_MODE === "true";

/**
 * Resolve a fonte da requisição atual (memoizada por request). O proxy já
 * renova o token antes de a página renderizar; o refresh aqui é só uma rede
 * de segurança (em memória — server components não podem gravar cookies).
 */
export const getSpotifySource = cache(async (): Promise<SpotifySource | null> => {
  if (isForcedMockMode()) return demoSource;

  const store = await cookies();
  if (store.get(DEMO_COOKIE)?.value === "1") return demoSource;
  if (!isSpotifyConfigured()) return null;

  const config = getSpotifyConfig();
  const session = unsealSession(store.get(SESSION_COOKIE)?.value, config.clientSecret);
  if (!session) return null;

  if (!isExpiring(session)) return liveSource(session.accessToken);
  if (!session.refreshToken) return null;
  try {
    const refreshed = sessionFromToken(await refreshAccessToken(config, session.refreshToken), session);
    return liveSource(refreshed.accessToken);
  } catch {
    return null;
  }
});
