import Link from "next/link";
import { cn } from "@godzilla/ui";
import { TIME_RANGES } from "@/config/spotify";
import type { TimeRange } from "@/lib/spotify/types";

/**
 * Seletor de período como links (?range=…): a página é Server Component e
 * refaz a busca no servidor, sem estado no cliente. Visual do TabsList do DS.
 */
export function RangeTabs({ pathname, active }: { pathname: string; active: TimeRange }) {
  return (
    <nav
      aria-label="Time range"
      className="inline-flex h-(--size-control-md) items-center gap-1 self-start rounded-md bg-muted p-1 text-muted-foreground"
    >
      {(Object.keys(TIME_RANGES) as TimeRange[]).map((range) => (
        <Link
          key={range}
          href={`${pathname}?range=${range}`}
          scroll={false}
          aria-current={range === active ? "page" : undefined}
          data-range={range}
          className={cn(
            "inline-flex h-full items-center whitespace-nowrap rounded-sm px-3 text-body-sm font-medium transition-colors duration-(--duration-fast) hover:text-foreground",
            range === active && "bg-background text-foreground shadow-xs",
          )}
        >
          {TIME_RANGES[range].short}
        </Link>
      ))}
    </nav>
  );
}
