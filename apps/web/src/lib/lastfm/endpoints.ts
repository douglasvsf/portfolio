import { CACHE_SECONDS, RECENTLY_PLAYED_LIMIT, TOP_LIMIT } from "@/config/spotify";
import type { TimeRange } from "@/lib/spotify/types";
import { PERIOD_BY_RANGE, splitRecentTracks, toArtist, toTopTrack, toUser } from "./adapter";
import { lastfmFetch } from "./client";
import { recentTracksSchema, topArtistsSchema, topTracksSchema, userInfoSchema } from "./schemas";

/** Métodos da API do Last.fm usados pelo app, já convertidos para os tipos da UI. */

export async function getUserInfo(user: string) {
  const data = await lastfmFetch("user.getinfo", { user }, { schema: userInfoSchema, revalidate: CACHE_SECONDS.profile });
  return toUser(data.user);
}

export async function getTopArtists(user: string, range: TimeRange, limit = TOP_LIMIT) {
  const data = await lastfmFetch(
    "user.gettopartists",
    { user, period: PERIOD_BY_RANGE[range], limit },
    { schema: topArtistsSchema, revalidate: CACHE_SECONDS.top },
  );
  return data.topartists.artist.map(toArtist);
}

export async function getTopTracks(user: string, range: TimeRange, limit = TOP_LIMIT) {
  const data = await lastfmFetch(
    "user.gettoptracks",
    { user, period: PERIOD_BY_RANGE[range], limit },
    { schema: topTracksSchema, revalidate: CACHE_SECONDS.top },
  );
  return data.toptracks.track.map(toTopTrack);
}

/** Histórico + "tocando agora" vêm do mesmo método — cache curto, como no Spotify. */
export async function getRecentTracks(user: string, limit = RECENTLY_PLAYED_LIMIT, revalidate: number = CACHE_SECONDS.recentlyPlayed) {
  const data = await lastfmFetch("user.getrecenttracks", { user, limit }, { schema: recentTracksSchema, revalidate });
  return splitRecentTracks(data.recenttracks.track);
}
