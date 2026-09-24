import { Clock } from "@godzilla/icons";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@godzilla/ui";
import { formatDuration, externalUrl } from "@/lib/spotify/transform";
import type { SpotifyTrack } from "@/lib/spotify/types";
import { CoverArt } from "../common/cover-art";
import { SpotifyLink } from "../common/spotify-link";

function Artists({ track }: { track: SpotifyTrack }) {
  return (
    <>
      {track.artists.map((artist, index) => (
        <span key={artist.id}>
          {index > 0 && ", "}
          <SpotifyLink href={externalUrl(artist)}>{artist.name}</SpotifyLink>
        </span>
      ))}
    </>
  );
}

const plays = (count: number) => `${count.toLocaleString("en-US")} play${count === 1 ? "" : "s"}`;

/**
 * Tabela no desktop, cards compactos no mobile. Colunas sem dado na fonte
 * somem (popularidade não vem da Spotify; álbum/duração não vêm no top do Last.fm).
 */
export function TrackList({ tracks }: { tracks: SpotifyTrack[] }) {
  const hasPopularity = tracks.some((track) => track.popularity !== undefined);
  const hasPlays = tracks.some((track) => track.playcount !== undefined);
  const hasAlbum = tracks.some((track) => track.album.name);
  const hasDuration = tracks.some((track) => track.duration_ms > 0);

  return (
    <>
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 text-right">#</TableHead>
              <TableHead className="w-14">
                <span className="sr-only">Cover</span>
              </TableHead>
              <TableHead>Track</TableHead>
              <TableHead>Artist</TableHead>
              {hasAlbum && <TableHead>Album</TableHead>}
              {hasPlays && <TableHead className="text-right">Plays</TableHead>}
              {hasPopularity && <TableHead className="text-right">Popularity</TableHead>}
              {hasDuration && (
                <TableHead className="text-right">
                  <Clock className="ml-auto size-(--size-icon-sm)" aria-label="Duration" />
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {tracks.map((track, index) => (
              <TableRow key={track.id} data-testid="track-row">
                <TableCell className="text-right font-mono text-muted-foreground">{index + 1}</TableCell>
                <TableCell>
                  <CoverArt images={track.album.images} seed={track.album.id} alt={`${track.album.name || track.name} cover`} size={40} />
                </TableCell>
                <TableCell className="max-w-64 truncate font-medium">
                  <SpotifyLink href={externalUrl(track)}>{track.name}</SpotifyLink>
                </TableCell>
                <TableCell className="max-w-48 truncate text-muted-foreground">
                  <Artists track={track} />
                </TableCell>
                {hasAlbum && (
                  <TableCell className="max-w-48 truncate text-muted-foreground">
                    <SpotifyLink href={externalUrl(track.album)}>{track.album.name}</SpotifyLink>
                  </TableCell>
                )}
                {hasPlays && (
                  <TableCell className="text-right font-mono tabular-nums text-muted-foreground">{track.playcount?.toLocaleString("en-US") ?? "—"}</TableCell>
                )}
                {hasPopularity && (
                  <TableCell className="text-right font-mono tabular-nums text-muted-foreground">{track.popularity ?? "—"}</TableCell>
                )}
                {hasDuration && (
                  <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                    {track.duration_ms > 0 ? formatDuration(track.duration_ms) : "—"}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ol className="flex flex-col divide-y divide-border md:hidden">
        {tracks.map((track, index) => (
          <li key={track.id} data-testid="track-card" className="flex items-center gap-3 px-1 py-2.5">
            <span className="w-6 text-right font-mono text-caption text-muted-foreground">{index + 1}</span>
            <CoverArt images={track.album.images} seed={track.album.id} alt={`${track.album.name || track.name} cover`} size={44} />
            <div className="flex min-w-0 flex-1 flex-col">
              <SpotifyLink href={externalUrl(track)} className="truncate font-medium">
                {track.name}
              </SpotifyLink>
              <span className="truncate text-caption text-muted-foreground">
                <Artists track={track} />
                {track.album.name && ` · ${track.album.name}`}
              </span>
            </div>
            <span className="shrink-0 font-mono text-caption tabular-nums text-muted-foreground">
              {track.playcount !== undefined ? plays(track.playcount) : track.duration_ms > 0 ? formatDuration(track.duration_ms) : null}
            </span>
          </li>
        ))}
      </ol>
    </>
  );
}
