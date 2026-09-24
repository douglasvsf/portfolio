import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Info } from "@godzilla/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, cn } from "@godzilla/ui";
import { TIME_RANGES, parseTimeRange, routes } from "@/config/spotify";
import { toErrorKind } from "@/lib/spotify/errors";
import { getSpotifySource, type SpotifySource } from "@/lib/spotify/source";
import {
  artistNames,
  artistsInTopTracks,
  decadeDistribution,
  formatCompact,
  genreDistribution,
  musicProfile,
  type NowPlaying as NowPlayingData,
} from "@/lib/spotify/transform";
import { CoverArt } from "@/components/spotify/common/cover-art";
import { PageHeader } from "@/components/spotify/common/page-header";
import { RangeTabs } from "@/components/spotify/common/range-tabs";
import { EmptyState, ErrorState } from "@/components/spotify/common/states";
import { GenreChart } from "@/components/spotify/charts/genre-chart";
import { DecadeChart } from "@/components/spotify/charts/decade-chart";
import { HorizontalBarChart } from "@/components/spotify/charts/horizontal-bar-chart";
import { HighlightCard } from "@/components/spotify/dashboard/highlight-card";
import { MusicProfile } from "@/components/spotify/dashboard/music-profile";
import { NowPlaying } from "@/components/spotify/dashboard/now-playing";
import { Era, Genre } from "@/components/spotify/dashboard/genre-icon";

export const metadata: Metadata = { title: "Overview" };

function timeAgo(iso: string, now: number) {
  const minutes = Math.round((now - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

/** O player é secundário: se falhar, o card mostra "nada tocando" em vez de quebrar a página. */
async function loadNowPlaying(source: SpotifySource): Promise<{ nowPlaying: NowPlayingData | null; fetchedAt: number }> {
  try {
    return { nowPlaying: await source.getNowPlaying(), fetchedAt: Date.now() };
  } catch {
    return { nowPlaying: null, fetchedAt: Date.now() };
  }
}

export default async function OverviewPage({ searchParams }: PageProps<"/spotify/dashboard">) {
  const range = parseTimeRange((await searchParams).range);
  const source = await getSpotifySource();
  if (!source) redirect(routes.landing);

  let data;
  try {
    const [artists, tracks, recent] = await Promise.all([
      source.getTopArtists(range),
      source.getTopTracks(range),
      source.getRecentlyPlayed(10),
    ]);
    data = { artists, tracks, recent };
  } catch (error) {
    return <ErrorState kind={toErrorKind(error)} retryHref={`${routes.dashboard}?range=${range}`} />;
  }

  const { nowPlaying, fetchedAt } = await loadNowPlaying(source);

  const { artists, tracks, recent } = data;
  const profile = musicProfile(artists, tracks);
  const genres = genreDistribution(artists);
  const decades = decadeDistribution(tracks);
  // Gêneros só aparecem quando a fonte envia (Spotify em Development Mode não envia).
  const hasGenres = genres.length > 0;
  const artistCounts = artistsInTopTracks(tracks);
  const lastPlayed = recent[0];
  const topArtist = profile.topArtist;
  const topTrack = profile.topTrack;
  const topArtistTracks = topArtist ? tracks.filter((track) => track.artists.some((artist) => artist.id === topArtist.id)).length : 0;

  return (
    <>
      <PageHeader
        title="Overview"
        description={`Your listening at a glance · ${TIME_RANGES[range].label}`}
        actions={<RangeTabs pathname={routes.dashboard} active={range} />}
      />

      <section aria-label="Highlights" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <HighlightCard
          testId="card-top-artist"
          label="Top artist"
          art={topArtist ? <CoverArt images={topArtist.images} seed={topArtist.id} alt={topArtist.name} size={52} variant="artist" /> : null}
          title={topArtist?.name ?? "No data yet"}
          subtitle={
            topArtist?.followers
              ? `${formatCompact(topArtist.followers.total)} followers`
              : topArtist?.genres?.length
                ? topArtist.genres.slice(0, 2).join(", ")
                : topArtistTracks
                  ? `In ${topArtistTracks} of your top tracks`
                  : undefined
          }
        />
        <HighlightCard
          testId="card-top-track"
          label="Top track"
          art={topTrack ? <CoverArt images={topTrack.album.images} seed={topTrack.album.id} alt={`${topTrack.album.name} cover`} size={52} /> : null}
          title={topTrack?.name ?? "No data yet"}
          subtitle={topTrack ? artistNames(topTrack) : undefined}
        />
        {hasGenres ? (
          <HighlightCard
            testId="card-top-genre"
            label="Top genre"
            art={<Genre />}
            title={genres[0].genre}
            subtitle={`${genres[0].artists} of ${artists.length} top artists`}
          />
        ) : (
          <HighlightCard
            testId="card-top-era"
            label="Top era"
            art={<Era />}
            title={profile.topDecade?.decade ?? "Unknown"}
            subtitle={profile.topDecade ? `${profile.topDecade.tracks} of your top ${tracks.length} tracks` : "No release dates available"}
          />
        )}
        <HighlightCard
          testId="card-recently-played"
          label="Recently played"
          art={
            lastPlayed ? (
              <CoverArt images={lastPlayed.track.album.images} seed={lastPlayed.track.album.id} alt={`${lastPlayed.track.album.name} cover`} size={52} />
            ) : null
          }
          title={lastPlayed?.track.name ?? "Nothing yet"}
          subtitle={lastPlayed ? `${artistNames(lastPlayed.track)} · ${timeAgo(lastPlayed.played_at, fetchedAt)}` : undefined}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <NowPlaying initial={nowPlaying} fetchedAt={fetchedAt} />
        <MusicProfile profile={profile} range={range} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {hasGenres && (
          <Card data-testid="genre-distribution">
            <CardHeader>
              <CardTitle>Genre Distribution</CardTitle>
              <CardDescription className="flex items-start gap-1.5">
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                Derived from {source.genreSource ?? "the genres"} of your top {artists.length} artists — not your full listening history.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GenreChart data={genres} />
            </CardContent>
          </Card>
        )}

        {decades.length > 0 && (
          <Card data-testid="decade-distribution">
            <CardHeader>
              <CardTitle>Your music by decade</CardTitle>
              <CardDescription>Release year of your top {tracks.length} tracks.</CardDescription>
            </CardHeader>
            <CardContent>
              <DecadeChart data={decades} />
            </CardContent>
          </Card>
        )}

        <Card className={cn(hasGenres && decades.length > 0 && "lg:col-span-2")}>
          <CardHeader>
            <CardTitle>Artists in your top tracks</CardTitle>
            <CardDescription>How many of your top {tracks.length} tracks feature each artist.</CardDescription>
          </CardHeader>
          <CardContent>
            {artistCounts.length ? (
              <HorizontalBarChart data={artistCounts} labelKey="artist" valueKey="tracks" valueLabel="Tracks" />
            ) : (
              <EmptyState title="No top tracks yet" description="Listen to more music and check back later — or try a longer period." />
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
