"use client";

import { useEffect, useState } from "react";
import { Card, cn } from "@godzilla/ui";
import { NOW_PLAYING_POLL_MS, routes } from "@/config/spotify";
import { artistNames, formatDuration, type NowPlaying as NowPlayingData } from "@/lib/spotify/transform";
import { CoverArt } from "../common/cover-art";
import { SpotifyLink } from "../common/spotify-link";

interface Snapshot {
  data: NowPlayingData | null;
  /** Momento (ms) em que `data.progressMs` foi medido. */
  at: number;
}

/**
 * Player "Now playing": recebe o estado inicial do servidor, avança a barra
 * localmente a cada segundo e consulta /api/spotify/now-playing periodicamente.
 * Nada tocando não é erro — só mostra o estado vazio.
 */
export function NowPlaying({ initial, fetchedAt }: { initial: NowPlayingData | null; fetchedAt: number }) {
  const [snapshot, setSnapshot] = useState<Snapshot>({ data: initial, at: fetchedAt });
  const [now, setNow] = useState(fetchedAt);

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      if (document.hidden) return;
      try {
        const response = await fetch(routes.nowPlaying, { cache: "no-store" });
        if (!response.ok) return; // mantém o último estado conhecido
        const body = (await response.json()) as { nowPlaying: NowPlayingData | null };
        if (!cancelled) setSnapshot({ data: body.nowPlaying, at: Date.now() });
      } catch {
        // falha de rede momentânea: tenta de novo no próximo ciclo
      }
    }
    const interval = setInterval(poll, NOW_PLAYING_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const { data } = snapshot;

  if (!data) {
    return (
      <Card className="flex items-center gap-4 p-5" data-testid="now-playing">
        <div className="flex size-16 items-center justify-center rounded-md bg-muted" aria-hidden="true">
          <Equalizer playing={false} />
        </div>
        <div>
          <p className="text-overline font-semibold uppercase tracking-widest text-muted-foreground">Now playing</p>
          <p className="font-medium">Nothing playing right now</p>
          <p className="text-body-sm text-muted-foreground">Play something on Spotify and it shows up here.</p>
        </div>
      </Card>
    );
  }

  const elapsed = data.isPlaying ? now - snapshot.at : 0;
  const progress = Math.min(data.progressMs + Math.max(0, elapsed), data.durationMs);
  const percent = data.durationMs ? (progress / data.durationMs) * 100 : 0;

  return (
    <Card className="relative overflow-hidden p-5" data-testid="now-playing">
      <div className="bg-aura pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />
      <div className="relative flex items-center gap-4">
        <CoverArt images={data.track.album.images} seed={data.track.album.id} alt={`${data.track.album.name} cover`} size={80} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="flex items-center gap-2 text-overline font-semibold uppercase tracking-widest text-primary">
            <Equalizer playing={data.isPlaying} />
            {data.isPlaying ? "Now playing" : "Paused"}
          </p>
          <SpotifyLink href={data.track.external_urls.spotify} className="truncate text-h4 font-semibold">
            {data.track.name}
          </SpotifyLink>
          <p className="truncate text-body-sm text-muted-foreground">{artistNames(data.track)}</p>
        </div>
      </div>
      <div className="relative mt-4 flex items-center gap-3 font-mono text-caption tabular-nums text-muted-foreground">
        <span>{formatDuration(progress)}</span>
        <div
          role="progressbar"
          aria-label="Playback progress"
          aria-valuemin={0}
          aria-valuemax={Math.round(data.durationMs / 1000)}
          aria-valuenow={Math.round(progress / 1000)}
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
        >
          <div className="h-full rounded-full bg-primary transition-[width] duration-1000 ease-linear" style={{ width: `${percent}%` }} />
        </div>
        <span>{formatDuration(data.durationMs)}</span>
      </div>
    </Card>
  );
}

function Equalizer({ playing }: { playing: boolean }) {
  return (
    <span className="flex h-3 items-end gap-0.5" aria-hidden="true">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className={cn("h-full w-0.5 rounded-full bg-current", playing ? "animate-equalizer" : "scale-y-50")}
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  );
}
