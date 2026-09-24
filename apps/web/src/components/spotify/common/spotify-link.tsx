import type { ReactNode } from "react";
import { cn } from "@godzilla/ui";

/** Link para o item no Spotify — parte da atribuição pedida pelas diretrizes da Spotify. */
export function SpotifyLink({ href, children, className }: { href?: string; children: ReactNode; className?: string }) {
  if (!href) return <span className={className}>{children}</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className={cn("underline-offset-4 hover:text-primary hover:underline", className)}
    >
      {children}
    </a>
  );
}
