import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card } from "@godzilla/ui";
import { TIME_RANGES, parseTimeRange, routes } from "@/config/spotify";
import { toErrorKind } from "@/lib/spotify/errors";
import { getSpotifySource } from "@/lib/spotify/source";
import { PageHeader } from "@/components/spotify/common/page-header";
import { RangeTabs } from "@/components/spotify/common/range-tabs";
import { EmptyState, ErrorState } from "@/components/spotify/common/states";
import { TrackList } from "@/components/spotify/tracks/track-list";

export const metadata: Metadata = { title: "Top Tracks" };

export default async function TopTracksPage({ searchParams }: PageProps<"/spotify/tracks">) {
  const range = parseTimeRange((await searchParams).range);
  const source = await getSpotifySource();
  if (!source) redirect(routes.landing);

  let tracks;
  try {
    tracks = await source.getTopTracks(range);
  } catch (error) {
    return <ErrorState kind={toErrorKind(error)} retryHref={`${routes.tracks}?range=${range}`} />;
  }

  return (
    <>
      <PageHeader
        title="Top Tracks"
        description={`${tracks.length} tracks · ${TIME_RANGES[range].label}`}
        actions={<RangeTabs pathname={routes.tracks} active={range} />}
      />
      <Card className="p-2 md:p-3">
        {tracks.length === 0 ? (
          <EmptyState title="No top tracks yet" description="Spotify needs more listening history for this period. Try a longer range." />
        ) : (
          <TrackList tracks={tracks} />
        )}
      </Card>
    </>
  );
}
