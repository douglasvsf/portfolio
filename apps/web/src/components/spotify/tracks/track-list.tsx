import { Clock } from "@godzilla/icons";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@godzilla/ui";
import { formatDuration } from "@/lib/spotify/transform";
import type { SpotifyTrack } from "@/lib/spotify/types";
import { CoverArt } from "../common/cover-art";
import { SpotifyLink } from "../common/spotify-link";

function Artists({ track }: { track: SpotifyTrack }) {
  return (
    <>
      {track.artists.map((artist, index) => (
        <span key={artist.id}>
          {index > 0 && ", "}
          <SpotifyLink href={artist.external_urls.spotify}>{artist.name}</SpotifyLink>
        </span>
      ))}
    </>
  );
}

/** Tabela no desktop, cards compactos no mobile. Popularidade só aparece se a API enviar. */
export function TrackList({ tracks }: { tracks: SpotifyTrack[] }) {
  const hasPopularity = tracks.some((track) => track.popularity !== undefined);

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
              <TableHead>Album</TableHead>
              {hasPopularity && <TableHead className="text-right">Popularity</TableHead>}
              <TableHead className="text-right">
                <Clock className="ml-auto size-(--size-icon-sm)" aria-label="Duration" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tracks.map((track, index) => (
              <TableRow key={track.id} data-testid="track-row">
                <TableCell className="text-right font-mono text-muted-foreground">{index + 1}</TableCell>
                <TableCell>
                  <CoverArt images={track.album.images} seed={track.album.id} alt={`${track.album.name} cover`} size={40} />
                </TableCell>
                <TableCell className="max-w-64 truncate font-medium">
                  <SpotifyLink href={track.external_urls.spotify}>{track.name}</SpotifyLink>
                </TableCell>
                <TableCell className="max-w-48 truncate text-muted-foreground">
                  <Artists track={track} />
                </TableCell>
                <TableCell className="max-w-48 truncate text-muted-foreground">
                  <SpotifyLink href={track.album.external_urls.spotify}>{track.album.name}</SpotifyLink>
                </TableCell>
                {hasPopularity && (
                  <TableCell className="text-right font-mono tabular-nums text-muted-foreground">{track.popularity ?? "—"}</TableCell>
                )}
                <TableCell className="text-right font-mono tabular-nums text-muted-foreground">{formatDuration(track.duration_ms)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ol className="flex flex-col divide-y divide-border md:hidden">
        {tracks.map((track, index) => (
          <li key={track.id} data-testid="track-card" className="flex items-center gap-3 px-1 py-2.5">
            <span className="w-6 text-right font-mono text-caption text-muted-foreground">{index + 1}</span>
            <CoverArt images={track.album.images} seed={track.album.id} alt={`${track.album.name} cover`} size={44} />
            <div className="flex min-w-0 flex-1 flex-col">
              <SpotifyLink href={track.external_urls.spotify} className="truncate font-medium">
                {track.name}
              </SpotifyLink>
              <span className="truncate text-caption text-muted-foreground">
                <Artists track={track} /> · {track.album.name}
              </span>
            </div>
            <span className="font-mono text-caption tabular-nums text-muted-foreground">{formatDuration(track.duration_ms)}</span>
          </li>
        ))}
      </ol>
    </>
  );
}
