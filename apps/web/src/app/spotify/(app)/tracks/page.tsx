import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card } from "@godzilla/ui";
import { parseTimeRange, routes } from "@/config/spotify";
import { getSpotifyDictionary } from "@/content/spotify";
import { fmt } from "@/i18n/message";
import { getRequestLocale } from "@/i18n/request";
import { toErrorKind } from "@/lib/spotify/errors";
import { getSpotifySource } from "@/lib/spotify/source";
import { PageHeader } from "@/components/spotify/common/page-header";
import { RangeTabs } from "@/components/spotify/common/range-tabs";
import { EmptyState, ErrorState } from "@/components/spotify/common/states";
import { TrackList } from "@/components/spotify/tracks/track-list";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getSpotifyDictionary(await getRequestLocale()).tracks.title };
}

export default async function TopTracksPage({ searchParams }: PageProps<"/spotify/tracks">) {
  const range = parseTimeRange((await searchParams).range);
  const locale = await getRequestLocale();
  const dict = getSpotifyDictionary(locale);
  const t = dict.tracks;
  const source = await getSpotifySource();
  if (!source) redirect(routes.landing);

  let tracks;
  try {
    tracks = await source.getTopTracks(range);
  } catch (error) {
    return <ErrorState kind={toErrorKind(error)} retryHref={`${routes.tracks}?range=${range}`} dict={dict} />;
  }

  return (
    <>
      <PageHeader
        title={t.title}
        description={fmt(t.description, { n: tracks.length, range: dict.ranges[range].label })}
        actions={<RangeTabs pathname={routes.tracks} active={range} dict={dict} />}
      />
      <Card className="p-2 md:p-3">
        {tracks.length === 0 ? (
          <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
        ) : (
          <TrackList tracks={tracks} dict={dict} locale={locale} />
        )}
      </Card>
    </>
  );
}
