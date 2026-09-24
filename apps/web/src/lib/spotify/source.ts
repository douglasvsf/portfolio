import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { CACHE_SECONDS, RECENTLY_PLAYED_LIMIT, TOP_LIMIT } from "@/config/spotify";
import { getSpotifyConfig, isSpotifyConfigured, refreshAccessToken } from "./auth";
import * as api from "./endpoints";
import * as lastfm from "@/lib/lastfm/endpoints";
import { isLastfmConfigured } from "@/lib/lastfm/client";
import { withLastfmGenres } from "@/lib/lastfm/tags";
import { isValidLastfmUsername } from "@/lib/lastfm/username";
import { DEMO_COOKIE, DEMO_MOCK_VALUE, LASTFM_COOKIE, SESSION_COOKIE, isExpiring, sessionFromToken, unsealSession } from "./session";
import * as mock from "./mock-data";
import { getOwnerAccessToken, isOwnerConfigured } from "./owner";
import { normalizeNowPlaying, type NowPlaying } from "./transform";
import type { RecentlyPlayedItem, SpotifyArtist, SpotifyTrack, SpotifyUser, TimeRange } from "./types";

/**
 * Fonte de dados da UI. As páginas não sabem de onde vêm os dados — só
 * chamam `getSpotifySource()`:
 * - `live`: conta do próprio visitante (OAuth);
 * - `showcase`: estatísticas reais do dono do portfólio, para qualquer visitante;
 * - `lastfm`: qualquer pessoa, pelo nome de usuário do Last.fm (sem limite de usuários);
 * - `demo`: dados mockados (fallback quando a vitrine não está configurada).
 */
export type SourceMode = "live" | "showcase" | "lastfm" | "demo";

export interface SpotifySource {
  mode: SourceMode;
  /** De onde vêm os gêneros exibidos (a Spotify não envia em Development Mode). */
  genreSource: "lastfm" | "spotify" | null;
  getProfile(): Promise<SpotifyUser | null>;
  getTopArtists(range: TimeRange, limit?: number): Promise<SpotifyArtist[]>;
  getTopTracks(range: TimeRange, limit?: number): Promise<SpotifyTrack[]>;
  getRecentlyPlayed(limit?: number): Promise<RecentlyPlayedItem[]>;
  getNowPlaying(): Promise<NowPlaying | null>;
}

export const demoSource: SpotifySource = {
  mode: "demo",
  genreSource: "lastfm",
  getProfile: async () => mock.mockUser,
  getTopArtists: async (range, limit = TOP_LIMIT) => mock.mockTopArtists(range, limit),
  getTopTracks: async (range, limit = TOP_LIMIT) => mock.mockTopTracks(range, limit),
  getRecentlyPlayed: async (limit = RECENTLY_PLAYED_LIMIT) => mock.mockRecentlyPlayed(limit),
  getNowPlaying: async () => normalizeNowPlaying(mock.mockCurrentlyPlaying()),
};

/** Artistas da Spotify chegam sem gêneros — o Last.fm completa quando configurado. */
async function spotifyArtistsWithGenres(accessToken: string, range: TimeRange, limit?: number) {
  const artists = await api.getTopArtists(accessToken, range, limit);
  const missingGenres = artists.some((artist) => !artist.genres?.length);
  return missingGenres && isLastfmConfigured() ? withLastfmGenres(artists) : artists;
}

export function liveSource(accessToken: string, mode: "live" | "showcase" = "live"): SpotifySource {
  const nowPlayingCache = mode === "showcase" ? CACHE_SECONDS.showcaseNowPlaying : 0;
  return {
    mode,
    genreSource: isLastfmConfigured() ? "lastfm" : "spotify",
    getProfile: () => api.getCurrentUser(accessToken),
    getTopArtists: (range, limit) => spotifyArtistsWithGenres(accessToken, range, limit),
    getTopTracks: (range, limit) => api.getTopTracks(accessToken, range, limit),
    getRecentlyPlayed: (limit) => api.getRecentlyPlayed(accessToken, limit),
    getNowPlaying: async () => normalizeNowPlaying(await api.getCurrentlyPlaying(accessToken, nowPlayingCache)),
  };
}

/** Estatísticas de qualquer usuário do Last.fm (scrobbles), com gêneros pelas tags. */
export function lastfmSource(username: string): SpotifySource {
  return {
    mode: "lastfm",
    genreSource: "lastfm",
    getProfile: () => lastfm.getUserInfo(username),
    getTopArtists: async (range, limit) => withLastfmGenres(await lastfm.getTopArtists(username, range, limit)),
    getTopTracks: (range, limit) => lastfm.getTopTracks(username, range, limit),
    getRecentlyPlayed: async (limit) => (await lastfm.getRecentTracks(username, limit)).history,
    // "Tocando agora" vem do histórico recente; cache curto para refletir o momento.
    getNowPlaying: async () => (await lastfm.getRecentTracks(username, 1, CACHE_SECONDS.showcaseNowPlaying)).nowPlaying,
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
  const lastfmUser = store.get(LASTFM_COOKIE)?.value;
  if (isLastfmConfigured() && isValidLastfmUsername(lastfmUser)) return lastfmSource(lastfmUser);

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
