import type { ReactNode } from "react";
import { AlertTriangle, Music, RefreshCw } from "@godzilla/icons";
import { Card, cn } from "@godzilla/ui";
import { routes } from "@/config/spotify";
import { friendlyMessages, type SpotifyErrorKind } from "@/lib/spotify/errors";

const actionClass =
  "inline-flex h-(--size-control-sm) items-center gap-2 rounded-md border border-input bg-background px-3 text-body-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground";

export function EmptyState({ title, description, className }: { title: string; description: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-2 px-6 py-12 text-center", className)}>
      <Music className="size-(--size-icon-lg) text-muted-foreground" aria-hidden="true" />
      <p className="font-semibold">{title}</p>
      <p className="max-w-sm text-body-sm text-muted-foreground">{description}</p>
    </div>
  );
}

/** Erro amigável — nunca mostra detalhes técnicos. Sessão/permissão oferecem reconectar ou o demo. */
export function ErrorState({ kind, retryHref }: { kind: SpotifyErrorKind; retryHref?: string }) {
  const message = friendlyMessages[kind];
  const needsAuth = kind === "unauthorized" || kind === "forbidden";

  return (
    <Card role="alert" className="mx-auto flex w-full max-w-xl flex-col items-center gap-3 px-6 py-10 text-center">
      <AlertTriangle className="size-(--size-icon-lg) text-warning" aria-hidden="true" />
      <h2 className="text-h4 font-semibold">{message.title}</h2>
      <p className="text-body-sm text-muted-foreground">{message.description}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {needsAuth ? (
          <>
            <a href={routes.login} className={actionClass}>
              Reconnect Spotify
            </a>
            <a href={routes.demo} className={actionClass}>
              View demo
            </a>
          </>
        ) : (
          <a href={retryHref ?? "."} className={actionClass}>
            <RefreshCw className="size-(--size-icon-sm)" aria-hidden="true" />
            Try again
          </a>
        )}
      </div>
    </Card>
  );
}
