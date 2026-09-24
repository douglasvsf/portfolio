import Image from "next/image";
import { cn } from "@godzilla/ui";

/** Logo da empresa (SVG da brapi) — cai para as iniciais quando não há logo. */
export function StockLogo({ src, ticker, size = 28, className }: { src?: string | null; ticker: string; size?: number; className?: string }) {
  const classes = cn("shrink-0 overflow-hidden rounded-md border border-border bg-secondary", className);

  if (!src) {
    return (
      <span
        aria-hidden="true"
        style={{ width: size, height: size }}
        className={cn(classes, "inline-flex items-center justify-center font-mono text-overline text-muted-foreground")}
      >
        {ticker.slice(0, 2)}
      </span>
    );
  }

  return <Image src={src} alt="" width={size} height={size} unoptimized className={classes} />;
}
