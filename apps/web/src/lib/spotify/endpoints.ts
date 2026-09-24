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

/** Sem cache: o "now playing" precisa refletir o momento. `null` = nada tocando. */
export async function getCurrentlyPlaying(token: string) {
  return spotifyFetch<CurrentlyPlaying>("/me/player/currently-playing", token);
}

export async function getPlaybackState(token: string) {
  return spotifyFetch<PlaybackState>("/me/player", token);
}
