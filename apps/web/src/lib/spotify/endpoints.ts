import { CACHE_SECONDS, RECENTLY_PLAYED_LIMIT, TOP_LIMIT } from "@/config/spotify";
import { spotifyFetch } from "./client";
import type {
  CurrentlyPlaying,
  PlaybackState,
  RecentlyPlayedResponse,
  SpotifyUser,
  TimeRange,
  TopArtistsResponse,
  TopTracksResponse,
} from "./types";

/** Endpoints da Spotify Web API usados pelo app — cada um com sua política de cache. */

export async function getCurrentUser(token: string) {
  return spotifyFetch<SpotifyUser>("/me", token, { revalidate: CACHE_SECONDS.profile });
}

export async function getTopArtists(token: string, timeRange: TimeRange, limit = TOP_LIMIT) {
  const data = await spotifyFetch<TopArtistsResponse>("/me/top/artists", token, {
    params: { time_range: timeRange, limit },
    revalidate: CACHE_SECONDS.top,
  });
  return data?.items ?? [];
}

export async function getTopTracks(token: string, timeRange: TimeRange, limit = TOP_LIMIT) {
  const data = await spotifyFetch<TopTracksResponse>("/me/top/tracks", token, {
    params: { time_range: timeRange, limit },
    revalidate: CACHE_SECONDS.top,
  });
  return data?.items ?? [];
}

export async function getRecentlyPlayed(token: string, limit = RECENTLY_PLAYED_LIMIT) {
  const data = await spotifyFetch<RecentlyPlayedResponse>("/me/player/recently-played", token, {
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
  return spotifyFetch<CurrentlyPlaying>("/me/player/currently-playing", token, { revalidate });
}

export async function getPlaybackState(token: string) {
  return spotifyFetch<PlaybackState>("/me/player", token);
}
