import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@godzilla/ui";
import { TIME_RANGES } from "@/config/spotify";
import { formatDuration, type MusicProfile as Profile } from "@/lib/spotify/transform";
import type { TimeRange } from "@/lib/spotify/types";

/** "Your Music Profile" — números derivados exclusivamente das respostas da API. */
export function MusicProfile({ profile, range }: { profile: Profile; range: TimeRange }) {
  const rows: { label: string; value: string }[] = [
    { label: "Artists analyzed", value: String(profile.artistsAnalyzed) },
    { label: "Tracks analyzed", value: String(profile.tracksAnalyzed) },
    { label: "Genres discovered", value: String(profile.genresDiscovered) },
    { label: "Most common genre", value: profile.topGenre ?? "—" },
    { label: "Top artist", value: profile.topArtist?.name ?? "—" },
    { label: "Top track", value: profile.topTrack?.name ?? "—" },
    { label: "Avg. track length", value: profile.averageTrackMs ? formatDuration(profile.averageTrackMs) : "—" },
  ];

  return (
    <Card data-testid="music-profile">
      <CardHeader>
        <CardTitle>Your Music Profile</CardTitle>
        <CardDescription>{TIME_RANGES[range].label}</CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
          {rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-2">
              <dt className="text-body-sm text-muted-foreground">{row.label}</dt>
              <dd className="truncate text-right font-medium">{row.value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
