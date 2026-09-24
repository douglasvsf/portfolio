import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@godzilla/ui";
import type { SpotifyDictionary } from "@/content/spotify";
import { formatDuration, releaseYear, type MusicProfile as Profile } from "@/lib/spotify/transform";
import type { TimeRange } from "@/lib/spotify/types";

/**
 * "Your Music Profile" — números derivados exclusivamente das respostas da
 * API. Linhas sem dado (ex.: gêneros no Development Mode da Spotify) somem.
 */
export function MusicProfile({ profile, range, dict }: { profile: Profile; range: TimeRange; dict: SpotifyDictionary }) {
  const t = dict.profile;
  const newestYear = profile.newestTrack ? releaseYear(profile.newestTrack) : null;
  const oldestYear = profile.oldestTrack ? releaseYear(profile.oldestTrack) : null;

  const rows: { label: string; value: string | null }[] = [
    { label: t.artistsAnalyzed, value: String(profile.artistsAnalyzed) },
    { label: t.tracksAnalyzed, value: String(profile.tracksAnalyzed) },
    { label: t.topArtist, value: profile.topArtist?.name ?? null },
    { label: t.topTrack, value: profile.topTrack?.name ?? null },
    { label: t.topGenre, value: profile.topGenre },
    { label: t.genresDiscovered, value: profile.genresDiscovered ? String(profile.genresDiscovered) : null },
    { label: t.favouriteEra, value: profile.topDecade?.decade ?? null },
    { label: t.newestRelease, value: newestYear ? `${profile.newestTrack?.name} (${newestYear})` : null },
    { label: t.oldestRelease, value: oldestYear ? `${profile.oldestTrack?.name} (${oldestYear})` : null },
    { label: t.explicitTracks, value: profile.explicitShare !== null ? `${Math.round(profile.explicitShare * 100)}%` : null },
    { label: t.averageLength, value: profile.averageTrackMs ? formatDuration(profile.averageTrackMs) : null },
  ];

  return (
    <Card data-testid="music-profile">
      <CardHeader>
        <CardTitle as="h2">{t.title}</CardTitle>
        <CardDescription>{dict.ranges[range].label}</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {rows
            .filter((row): row is { label: string; value: string } => Boolean(row.value))
            .map((row) => (
              <div key={row.label} className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-2">
                <dt className="shrink-0 text-body-sm text-muted-foreground">{row.label}</dt>
                <dd className="truncate text-right font-medium" title={row.value}>
                  {row.value}
                </dd>
              </div>
            ))}
        </dl>
      </CardContent>
    </Card>
  );
}
