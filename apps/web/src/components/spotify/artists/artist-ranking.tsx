import { Badge, Card, cn } from "@godzilla/ui";
import { formatCompact, normalizeGenre } from "@/lib/spotify/transform";
import type { SpotifyArtist } from "@/lib/spotify/types";
import { CoverArt } from "../common/cover-art";
import { SpotifyLink } from "../common/spotify-link";

const MAX_GENRES = 3;

function Meta({ artist }: { artist: SpotifyArtist }) {
  const parts = [
    artist.followers ? `${formatCompact(artist.followers.total)} followers` : null,
    artist.popularity !== undefined ? `Popularity ${artist.popularity}` : null,
  ].filter(Boolean);
  if (!parts.length) return null;
  return <p className="text-caption text-muted-foreground">{parts.join(" · ")}</p>;
}

function Genres({ genres }: { genres?: string[] }) {
  if (!genres?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {genres.slice(0, MAX_GENRES).map((genre) => (
        <Badge key={genre} variant="secondary" className="font-normal">
          {normalizeGenre(genre)}
        </Badge>
      ))}
    </div>
  );
}

/** Ranking: pódio para o top 3 e lista para o restante. Posição = ordem da API, sem pontuação inventada. */
export function ArtistRanking({ artists }: { artists: SpotifyArtist[] }) {
  const podium = artists.slice(0, 3);
  const rest = artists.slice(3);

  return (
    <div className="flex flex-col gap-6">
      <ol className="grid gap-4 md:grid-cols-3" aria-label="Top 3 artists">
        {podium.map((artist, index) => (
          <li key={artist.id}>
            <Card
              data-testid="artist-card"
              className={cn(
                "relative flex h-full flex-col items-center gap-3 overflow-hidden p-6 text-center",
                index === 0 && "border-primary/50",
              )}
            >
              {index === 0 && <div className="bg-aura pointer-events-none absolute inset-0" aria-hidden="true" />}
              <span className={cn("relative font-mono text-h3 font-bold", index === 0 ? "text-neon" : "text-muted-foreground")}>
                #{index + 1}
              </span>
              <CoverArt images={artist.images} seed={artist.id} alt={artist.name} size={112} variant="artist" className="relative" />
              <div className="relative flex flex-col items-center gap-2">
                <SpotifyLink href={artist.external_urls.spotify} className="text-h4 font-semibold">
                  {artist.name}
                </SpotifyLink>
                <Meta artist={artist} />
                <Genres genres={artist.genres} />
              </div>
            </Card>
          </li>
        ))}
      </ol>

      {rest.length > 0 && (
        <ol start={4} className="grid gap-2 md:grid-cols-2" aria-label="More top artists">
          {rest.map((artist, index) => (
            <li key={artist.id} data-testid="artist-card" className="flex items-center gap-4 rounded-lg border border-border bg-card p-3">
              <span className="w-7 text-right font-mono text-body-sm text-muted-foreground">#{index + 4}</span>
              <CoverArt images={artist.images} seed={artist.id} alt={artist.name} size={52} variant="artist" />
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <SpotifyLink href={artist.external_urls.spotify} className="truncate font-semibold">
                  {artist.name}
                </SpotifyLink>
                <Meta artist={artist} />
                <Genres genres={artist.genres?.slice(0, 2)} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
