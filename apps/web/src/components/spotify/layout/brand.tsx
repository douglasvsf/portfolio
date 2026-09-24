import { cn } from "@godzilla/ui";

/** Logo do app: equalizador + "GODZILLA SPOTIFY STATS" (texto encurta no mobile). */
export function Brand({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2 whitespace-nowrap font-mono text-body-sm font-bold tracking-widest", className)}>
      <span className="flex h-5 items-end gap-0.5" aria-hidden="true">
        <span className="h-2.5 w-1 rounded-full bg-neon" />
        <span className="h-5 w-1 rounded-full bg-primary" />
        <span className="h-3.5 w-1 rounded-full bg-neon" />
      </span>
      <span>
        GODZILLA<span className="hidden sm:inline"> SPOTIFY</span> <span className="text-primary">STATS</span>
      </span>
    </span>
  );
}
