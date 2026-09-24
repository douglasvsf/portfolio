"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

/**
 * Error boundaries do React engolem o erro: sem isso, falhas de renderização
 * no navegador nunca chegam ao Sentry. (Erros do servidor já vão pelo
 * `onRequestError` em instrumentation.ts — o digest liga os dois.)
 */
export function useReportError(error: Error & { digest?: string }) {
  useEffect(() => {
    Sentry.captureException(error, { tags: error.digest ? { digest: error.digest } : undefined });
  }, [error]);
}
