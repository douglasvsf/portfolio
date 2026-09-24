"use client";

import { useMemo, useSyncExternalStore } from "react";
import { artistNames, groupByDay, externalUrl } from "@/lib/spotify/transform";
import type { RecentlyPlayedItem } from "@/lib/spotify/types";
import { CoverArt } from "../common/cover-art";
import { SpotifyLink } from "../common/spotify-link";

/**
 * Client Component para formatar horários no fuso do visitante (o servidor
 * roda em UTC na Vercel): renderiza em UTC no servidor e troca para o fuso
 * local após a hidratação. Agrupa por dia: "Today", "Yesterday" ou a data.
 */
const noopSubscribe = () => () => {};
const localTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const serverTimeZone = () => "UTC";

export function Timeline({ items }: { items: RecentlyPlayedItem[] }) {
  const timeZone = useSyncExternalStore(noopSubscribe, localTimeZone, serverTimeZone);
  const days = useMemo(() => groupByDay(items, timeZone), [items, timeZone]);
  const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone });

  return (
    <div className="flex flex-col gap-8">
      {days.map((day) => (
        <section key={day.day} aria-label={dayLabel(day.day, timeZone)}>
          <h2 className="sticky top-28 z-10 mb-3 w-fit rounded-md bg-background/90 px-2 py-1 text-overline font-semibold uppercase tracking-widest text-muted-foreground backdrop-blur lg:top-18">
            {dayLabel(day.day, timeZone)}
          </h2>
          <ol className="relative ml-3 border-l border-border">
            {day.items.map((item) => (
              <li key={item.played_at} data-testid="timeline-item" className="relative flex items-center gap-4 py-2.5 pl-6">
                <span className="absolute -left-[5px] size-2.5 rounded-full border-2 border-background bg-primary" aria-hidden="true" />
                <time dateTime={item.played_at} className="w-12 shrink-0 font-mono text-body-sm tabular-nums text-primary">
                  {time.format(new Date(item.played_at))}
                </time>
                <CoverArt images={item.track.album.images} seed={item.track.album.id} alt={`${item.track.album.name || item.track.name} cover`} size={44} />
                <div className="flex min-w-0 flex-col">
                  <SpotifyLink href={externalUrl(item.track)} className="truncate font-medium">
                    {item.track.name}
                  </SpotifyLink>
                  <span className="truncate text-caption text-muted-foreground">
                    {artistNames(item.track)}
                    {item.track.album.name && ` · ${item.track.album.name}`}
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}

function dayLabel(day: string, timeZone: string) {
  const today = new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date());
  const yesterday = new Intl.DateTimeFormat("en-CA", { timeZone }).format(new Date(Date.now() - 86_400_000));
  if (day === today) return "Today";
  if (day === yesterday) return "Yesterday";
  return new Intl.DateTimeFormat("en-US", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));
}
