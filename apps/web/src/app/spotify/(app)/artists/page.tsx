import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@godzilla/ui";
import { parseTimeRange, routes } from "@/config/spotify";
import { getSpotifyDictionary } from "@/content/spotify";
import { fmt } from "@/i18n/message";
import { getRequestLocale } from "@/i18n/request";
import { toErrorKind } from "@/lib/spotify/errors";
import { getSpotifySource } from "@/lib/spotify/source";
import { ArtistRanking } from "@/components/spotify/artists/artist-ranking";
import { HorizontalBarChart } from "@/components/spotify/charts/horizontal-bar-chart";
import { PageHeader } from "@/components/spotify/common/page-header";
import { RangeTabs } from "@/components/spotify/common/range-tabs";
import { EmptyState, ErrorState } from "@/components/spotify/common/states";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getSpotifyDictionary(await getRequestLocale()).artists.title };
}

export default async function TopArtistsPage({ searchParams }: PageProps<"/spotify/artists">) {
  const range = parseTimeRange((await searchParams).range);
  const locale = await getRequestLocale();
  const dict = getSpotifyDictionary(locale);
  const t = dict.artists;
  const source = await getSpotifySource();
  if (!source) redirect(routes.landing);

  let artists;
  try {
    artists = await source.getTopArtists(range);
  } catch (error) {
    return <ErrorState kind={toErrorKind(error)} retryHref={`${routes.artists}?range=${range}`} dict={dict} />;
  }

  // Popularidade não vem para apps em Development Mode — o gráfico só aparece se houver dado.
  const popularity = artists
    .filter((artist) => artist.popularity !== undefined)
    .slice(0, 10)
    .map((artist) => ({ artist: artist.name, popularity: artist.popularity ?? 0 }));

  return (
    <>
      <PageHeader
        title={t.title}
        description={fmt(t.description, { n: artists.length, range: dict.ranges[range].label })}
        actions={<RangeTabs pathname={routes.artists} active={range} dict={dict} />}
      />

      {artists.length === 0 ? (
        <Card>
          <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
        </Card>
      ) : (
        <ArtistRanking artists={artists} dict={dict} locale={locale} />
      )}

      {popularity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t.popularityTitle}</CardTitle>
            <CardDescription>{t.popularityDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart data={popularity} labelKey="artist" valueKey="popularity" valueLabel={t.popularityLabel} max={100} />
          </CardContent>
        </Card>
      )}
    </>
  );
}
