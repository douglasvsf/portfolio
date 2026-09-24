"use client";

import { AlertTriangle } from "@godzilla/icons";
import { Button, Card } from "@godzilla/ui";
import { useSpotifyDictionary } from "@/content/spotify";

/** Última rede de proteção: mensagem amigável, sem stack trace, com opção de tentar de novo. */
export default function DashboardError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { dict } = useSpotifyDictionary();
  return (
    <Card role="alert" className="mx-auto flex w-full max-w-xl flex-col items-center gap-3 px-6 py-10 text-center">
      <AlertTriangle className="size-(--size-icon-lg) text-warning" aria-hidden="true" />
      <h2 className="text-h4 font-semibold">{dict.errors.boundaryTitle}</h2>
      <p className="text-body-sm text-muted-foreground">{dict.errors.boundaryDescription}</p>
      <Button onClick={() => retry()} className="mt-2">
        {dict.errors.tryAgain}
      </Button>
    </Card>
  );
}
