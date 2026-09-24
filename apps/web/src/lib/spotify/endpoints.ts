import { CACHE_SECONDS, RECENTLY_PLAYED_LIMIT, TOP_LIMIT } from "@/config/spotify";
import { spotifyFetch } from "./client";
import {
  currentlyPlayingSchema,
  playbackStateSchema,
  recentlyPlayedSchema,
  topArtistsSchema,
  topTracksSchema,
  userSchema,
} from "./schemas";
import type { TimeRange } from "./types";

/**
 * Endpoints da Spotify Web API usados pelo app — cada um com seu contrato
 * (schemas.ts) e sua política de cache.
 */

export async function getCurrentUser(token: string) {
  return spotifyFetch("/me", token, { schema: userSchema, revalidate: CACHE_SECONDS.profile });
}

export async function getTopArtists(token: string, timeRange: TimeRange, limit = TOP_LIMIT) {
  const data = await spotifyFetch("/me/top/artists", token, {
    schema: topArtistsSchema,
    params: { time_range: timeRange, limit },
    revalidate: CACHE_SECONDS.top,
  });
  return data?.items ?? [];
}

export async function getTopTracks(token: string, timeRange: TimeRange, limit = TOP_LIMIT) {
  const data = await spotifyFetch("/me/top/tracks", token, {
    schema: topTracksSchema,
    params: { time_range: timeRange, limit },
    revalidate: CACHE_SECONDS.top,
  });
  return data?.items ?? [];
}

export async function getRecentlyPlayed(token: string, limit = RECENTLY_PLAYED_LIMIT) {
  const data = await spotifyFetch("/me/player/recently-played", token, {
    schema: recentlyPlayedSchema,
    params: { limit },
    revalidate: CACHE_SECONDS.recentlyPlayed,
  });
  return data?.items ?? [];
}

/**
 * Sem cache por padrão: o "now playing" precisa refletir o momento. No modo
 * vitrine (muitos visitantes, uma conta) usa um cache curto para poupar a API.
 * `null` = nada tocando.
 */
export async function getCurrentlyPlaying(token: string, revalidate = 0) {
  return spotifyFetch("/me/player/currently-playing", token, { schema: currentlyPlayingSchema, revalidate });
}

export async function getPlaybackState(token: string) {
  return spotifyFetch("/me/player", token, { schema: playbackStateSchema });
}
