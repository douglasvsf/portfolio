"use client";

import { useReportError } from "@/lib/observability/use-report-error";
import "./globals.css";

/**
 * Última linha de defesa: erro no próprio root layout. Substitui o layout
 * inteiro, então não há dicionário nem Design System carregado — texto
 * mínimo e bilíngue.
 */
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useReportError(error);
  return (
    <html lang="pt-BR" className="dark">
      <body className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background p-6 text-center text-foreground">
        <h1 className="text-2xl font-semibold">Algo deu errado · Something went wrong</h1>
        <button type="button" onClick={() => retry()} className="rounded-md border border-border px-4 py-2">
          Tentar de novo · Try again
        </button>
      </body>
    </html>
  );
}
