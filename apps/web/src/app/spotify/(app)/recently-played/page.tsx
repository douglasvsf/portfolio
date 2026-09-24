import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Card } from "@godzilla/ui";
import { routes } from "@/config/spotify";
import { getSpotifyDictionary } from "@/content/spotify";
import { getRequestLocale } from "@/i18n/request";
import { toErrorKind } from "@/lib/spotify/errors";
import { getSpotifySource } from "@/lib/spotify/source";
import { PageHeader } from "@/components/spotify/common/page-header";
import { EmptyState, ErrorState } from "@/components/spotify/common/states";
import { Timeline } from "@/components/spotify/recent/timeline";

export async function generateMetadata(): Promise<Metadata> {
  return { title: getSpotifyDictionary(await getRequestLocale()).recent.title };
}

export default async function RecentlyPlayedPage() {
  const source = await getSpotifySource();
  if (!source) redirect(routes.landing);
  const dict = getSpotifyDictionary(await getRequestLocale());
  const t = dict.recent;

  let items;
  try {
    items = await source.getRecentlyPlayed();
  } catch (error) {
    return <ErrorState kind={toErrorKind(error)} retryHref={routes.recentlyPlayed} dict={dict} />;
  }

  return (
    <>
      <PageHeader
        title={t.title}
        description={
          source.mode === "lastfm" ? t.descriptionLastfm : t.descriptionSpotify
        }
      />
      {items.length === 0 ? (
        <Card>
          <EmptyState title={t.emptyTitle} description={t.emptyDescription} />
        </Card>
      ) : (
        <Timeline items={items} />
      )}
    </>
  );
}
