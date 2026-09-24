"use client";

import { AlertTriangle } from "@godzilla/icons";
import { Button, Card } from "@godzilla/ui";

/** Última rede de proteção: mensagem amigável, sem stack trace, com opção de tentar de novo. */
export default function DashboardError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <Card role="alert" className="mx-auto flex w-full max-w-xl flex-col items-center gap-3 px-6 py-10 text-center">
      <AlertTriangle className="size-(--size-icon-lg) text-warning" aria-hidden="true" />
      <h2 className="text-h4 font-semibold">Something went wrong</h2>
      <p className="text-body-sm text-muted-foreground">We couldn&apos;t load this page. Please try again in a moment.</p>
      <Button onClick={() => retry()} className="mt-2">
        Try again
      </Button>
    </Card>
  );
}
