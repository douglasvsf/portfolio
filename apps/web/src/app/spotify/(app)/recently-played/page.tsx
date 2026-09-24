import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card } from "@godzilla/ui";
import { routes } from "@/config/spotify";
import { toErrorKind } from "@/lib/spotify/errors";
import { getSpotifySource } from "@/lib/spotify/source";
import { PageHeader } from "@/components/spotify/common/page-header";
import { EmptyState, ErrorState } from "@/components/spotify/common/states";
import { Timeline } from "@/components/spotify/recent/timeline";

export const metadata: Metadata = { title: "Recently Played" };

export default async function RecentlyPlayedPage() {
  const source = await getSpotifySource();
  if (!source) redirect(routes.landing);

  let items;
  try {
    items = await source.getRecentlyPlayed();
  } catch (error) {
    return <ErrorState kind={toErrorKind(error)} retryHref={routes.recentlyPlayed} />;
  }

  return (
    <>
      <PageHeader
        title="Recently Played"
        description={
          source.mode === "lastfm" ? "Your last 50 scrobbles on Last.fm." : "Your last 50 plays — the most Spotify's API makes available."
        }
      />
      {items.length === 0 ? (
        <Card>
          <EmptyState title="No listening history yet" description="Play some music on Spotify and your recent tracks will show up here." />
        </Card>
      ) : (
        <Timeline items={items} />
      )}
    </>
  );
}
