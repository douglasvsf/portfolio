import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@godzilla/ui";
import { TIME_RANGES, parseTimeRange, routes } from "@/config/spotify";
import { toErrorKind } from "@/lib/spotify/errors";
import { getSpotifySource } from "@/lib/spotify/source";
import { ArtistRanking } from "@/components/spotify/artists/artist-ranking";
import { HorizontalBarChart } from "@/components/spotify/charts/horizontal-bar-chart";
import { PageHeader } from "@/components/spotify/common/page-header";
import { RangeTabs } from "@/components/spotify/common/range-tabs";
import { EmptyState, ErrorState } from "@/components/spotify/common/states";

export const metadata: Metadata = { title: "Top Artists" };

export default async function TopArtistsPage({ searchParams }: PageProps<"/spotify/artists">) {
  const range = parseTimeRange((await searchParams).range);
  const source = await getSpotifySource();
  if (!source) redirect(routes.landing);

  let artists;
  try {
    artists = await source.getTopArtists(range);
  } catch (error) {
    return <ErrorState kind={toErrorKind(error)} retryHref={`${routes.artists}?range=${range}`} />;
  }

  // Popularidade não vem para apps em Development Mode — o gráfico só aparece se houver dado.
  const popularity = artists
    .filter((artist) => artist.popularity !== undefined)
    .slice(0, 10)
    .map((artist) => ({ artist: artist.name, popularity: artist.popularity ?? 0 }));

  return (
    <>
      <PageHeader
        title="Top Artists"
        description={`${artists.length} artists · ${TIME_RANGES[range].label}`}
        actions={<RangeTabs pathname={routes.artists} active={range} />}
      />

      {artists.length === 0 ? (
        <Card>
          <EmptyState title="No top artists yet" description="Spotify needs more listening history for this period. Try a longer range." />
        </Card>
      ) : (
        <ArtistRanking artists={artists} />
      )}

      {popularity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Artist Popularity</CardTitle>
            <CardDescription>Spotify&apos;s popularity index (0–100) for your top 10 artists.</CardDescription>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart data={popularity} labelKey="artist" valueKey="popularity" valueLabel="Popularity" max={100} />
          </CardContent>
        </Card>
      )}
    </>
  );
}
