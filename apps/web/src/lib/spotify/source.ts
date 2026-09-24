import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { CACHE_SECONDS, RECENTLY_PLAYED_LIMIT, TOP_LIMIT } from "@/config/spotify";
import { getSpotifyConfig, isSpotifyConfigured, refreshAccessToken } from "./auth";
import * as api from "./endpoints";
import { DEMO_COOKIE, DEMO_MOCK_VALUE, SESSION_COOKIE, isExpiring, sessionFromToken, unsealSession } from "./session";
import * as mock from "./mock-data";
import { getOwnerAccessToken, isOwnerConfigured } from "./owner";
import { normalizeNowPlaying, type NowPlaying } from "./transform";
import type { RecentlyPlayedItem, SpotifyArtist, SpotifyTrack, SpotifyUser, TimeRange } from "./types";

/**
 * Fonte de dados da UI. As páginas não sabem de onde vêm os dados — só
 * chamam `getSpotifySource()`:
 * - `live`: conta do próprio visitante (OAuth);
 * - `showcase`: estatísticas reais do dono do portfólio, para qualquer visitante;
 * - `demo`: dados mockados (fallback quando a vitrine não está configurada).
 */
export type SourceMode = "live" | "showcase" | "demo";

export interface SpotifySource {
  mode: SourceMode;
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

export function liveSource(accessToken: string, mode: "live" | "showcase" = "live"): SpotifySource {
  const nowPlayingCache = mode === "showcase" ? CACHE_SECONDS.showcaseNowPlaying : 0;
  return {
    mode,
    getProfile: () => api.getCurrentUser(accessToken),
    getTopArtists: (range, limit) => api.getTopArtists(accessToken, range, limit),
    getTopTracks: (range, limit) => api.getTopTracks(accessToken, range, limit),
    getRecentlyPlayed: (limit) => api.getRecentlyPlayed(accessToken, limit),
    getNowPlaying: async () => normalizeNowPlaying(await api.getCurrentlyPlaying(accessToken, nowPlayingCache)),
  };
}

/** `MOCK_MODE=true` força o demo mockado para todo mundo (útil em preview/CI). */
export const isForcedMockMode = () => process.env.MOCK_MODE === "true";

/** A vitrine está disponível? (dono configurado e mock não forçado) */
export const isShowcaseAvailable = () => !isForcedMockMode() && isOwnerConfigured();

/** Vitrine com os dados do dono; se o token dele falhar, cai para o demo mockado. */
async function visitorSource(): Promise<SpotifySource> {
  if (!isShowcaseAvailable()) return demoSource;
  try {
    return liveSource(await getOwnerAccessToken(), "showcase");
  } catch (error) {
    console.warn("[spotify] modo vitrine indisponível — usando dados mockados:", error instanceof Error ? error.message : error);
    return demoSource;
  }
}

/**
 * Resolve a fonte da requisição atual (memoizada por request). O proxy já
 * renova o token antes de a página renderizar; o refresh aqui é só uma rede
 * de segurança (em memória — server components não podem gravar cookies).
 */
export const getSpotifySource = cache(async (): Promise<SpotifySource | null> => {
  if (isForcedMockMode()) return demoSource;

  const store = await cookies();
  const demoCookie = store.get(DEMO_COOKIE)?.value;
  if (demoCookie === DEMO_MOCK_VALUE) return demoSource;
  if (demoCookie === "1") return visitorSource();
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
