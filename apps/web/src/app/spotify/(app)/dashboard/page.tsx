import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Info } from "@godzilla/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, cn } from "@godzilla/ui";
import { parseTimeRange, routes } from "@/config/spotify";
import { getSpotifyDictionary, type SpotifyDictionary } from "@/content/spotify";
import { fmt } from "@/i18n/message";
import { getRequestLocale } from "@/i18n/request";
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

export async function generateMetadata(): Promise<Metadata> {
  return { title: getSpotifyDictionary(await getRequestLocale()).overview.title };
}

function timeAgo(iso: string, now: number, t: SpotifyDictionary["overview"]) {
  const minutes = Math.round((now - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return t.justNow;
  if (minutes < 60) return fmt(t.minutesAgo, { n: minutes });
  const hours = Math.round(minutes / 60);
  if (hours < 24) return fmt(t.hoursAgo, { n: hours });
  return fmt(t.daysAgo, { n: Math.round(hours / 24) });
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
  const locale = await getRequestLocale();
  const dict = getSpotifyDictionary(locale);
  const t = dict.overview;
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
    return <ErrorState kind={toErrorKind(error)} retryHref={`${routes.dashboard}?range=${range}`} dict={dict} />;
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
        title={t.title}
        description={fmt(t.description, { range: dict.ranges[range].label })}
        actions={<RangeTabs pathname={routes.dashboard} active={range} dict={dict} />}
      />

      <section aria-label={t.highlightsLabel} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <HighlightCard
          testId="card-top-artist"
          label={t.topArtist}
          art={topArtist ? <CoverArt images={topArtist.images} seed={topArtist.id} alt={topArtist.name} size={52} variant="artist" /> : null}
          title={topArtist?.name ?? t.noData}
          subtitle={
            topArtist?.followers
              ? fmt(t.followers, { n: formatCompact(topArtist.followers.total, locale) })
              : topArtist?.genres?.length
                ? topArtist.genres.slice(0, 2).join(", ")
                : topArtistTracks
                  ? fmt(t.inTopTracks, { n: topArtistTracks })
                  : undefined
          }
        />
        <HighlightCard
          testId="card-top-track"
          label={t.topTrack}
          art={topTrack ? <CoverArt images={topTrack.album.images} seed={topTrack.album.id} alt={fmt(dict.tracks.coverAlt, { name: topTrack.album.name || topTrack.name })} size={52} /> : null}
          title={topTrack?.name ?? t.noData}
          subtitle={topTrack ? artistNames(topTrack) : undefined}
        />
        {hasGenres ? (
          <HighlightCard
            testId="card-top-genre"
            label={t.topGenre}
            art={<Genre />}
            title={genres[0].genre}
            subtitle={fmt(t.ofTopArtists, { n: genres[0].artists, total: artists.length })}
          />
        ) : (
          <HighlightCard
            testId="card-top-era"
            label={t.topEra}
            art={<Era />}
            title={profile.topDecade?.decade ?? t.unknown}
            subtitle={profile.topDecade ? fmt(t.ofTopTracks, { n: profile.topDecade.tracks, total: tracks.length }) : t.noReleaseDates}
          />
        )}
        <HighlightCard
          testId="card-recently-played"
          label={t.recentlyPlayed}
          art={
            lastPlayed ? (
              <CoverArt images={lastPlayed.track.album.images} seed={lastPlayed.track.album.id} alt={fmt(dict.tracks.coverAlt, { name: lastPlayed.track.album.name || lastPlayed.track.name })} size={52} />
            ) : null
          }
          title={lastPlayed?.track.name ?? t.nothingYet}
          subtitle={lastPlayed ? `${artistNames(lastPlayed.track)} · ${timeAgo(lastPlayed.played_at, fetchedAt, t)}` : undefined}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <NowPlaying initial={nowPlaying} fetchedAt={fetchedAt} />
        <MusicProfile profile={profile} range={range} dict={dict} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        {hasGenres && (
          <Card data-testid="genre-distribution">
            <CardHeader>
              <CardTitle as="h2">{t.genreTitle}</CardTitle>
              <CardDescription className="flex items-start gap-1.5">
                <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                {fmt(t.genreDescription, { source: source.genreSource ? t.genreSources[source.genreSource] : t.genreSourceFallback, n: artists.length })}
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
              <CardTitle as="h2">{t.decadeTitle}</CardTitle>
              <CardDescription>{fmt(t.decadeDescription, { n: tracks.length })}</CardDescription>
            </CardHeader>
            <CardContent>
              <DecadeChart data={decades} />
            </CardContent>
          </Card>
        )}

        <Card className={cn(hasGenres && decades.length > 0 && "lg:col-span-2")}>
          <CardHeader>
            <CardTitle as="h2">{t.artistsTitle}</CardTitle>
            <CardDescription>{fmt(t.artistsDescription, { n: tracks.length })}</CardDescription>
          </CardHeader>
          <CardContent>
            {artistCounts.length ? (
              <HorizontalBarChart data={artistCounts} labelKey="artist" valueKey="tracks" valueLabel={t.tracksLabel} />
            ) : (
              <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
