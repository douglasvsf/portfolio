"use client";

import { useEffect, useState } from "react";
import type { MarketQuote } from "@/lib/portfolio/positions";

export interface CdiPeriod {
  from: string;
  to: string;
  percent: number;
  days: number;
}

export interface MarketData {
  status: "idle" | "loading" | "ready" | "error";
  quotes: Record<string, MarketQuote>;
  missing: string[];
  cdi: CdiPeriod | null;
  updatedAt: string | null;
}

type Payload = Omit<MarketData, "status">;

const EMPTY: MarketData = { status: "idle", quotes: {}, missing: [], cdi: null, updatedAt: null };

/**
 * Cotações e CDI para a carteira. Só tickers e a data da primeira operação
 * vão para o servidor — quantidades e preços ficam no navegador. Enquanto
 * uma nova consulta não volta, mantém os dados anteriores na tela.
 */
export function useMarketData(tickers: readonly string[], since: string | null): MarketData {
  const request = tickers.length ? new URLSearchParams({ tickers: [...tickers].sort().join(","), ...(since ? { since } : {}) }).toString() : "";
  const [last, setLast] = useState<{ request: string; ok: boolean; payload: Payload } | null>(null);

  useEffect(() => {
    if (!request) return;
    const controller = new AbortController();

    fetch(`/api/stocks/portfolio?${request}`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json() as Promise<Payload>;
      })
      .then((body) =>
        setLast({
          request,
          ok: true,
          payload: { quotes: body.quotes ?? {}, missing: body.missing ?? [], cdi: body.cdi ?? null, updatedAt: body.updatedAt ?? null },
        }),
      )
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        console.warn("[portfolio] falha ao buscar cotações", error);
        setLast((previous) => ({ request, ok: false, payload: previous?.payload ?? EMPTY }));
      });

    return () => controller.abort();
  }, [request]);

  if (!request) return EMPTY;
  const payload = last?.payload ?? EMPTY;
  if (last?.request !== request) return { ...payload, status: "loading" };
  return { ...payload, status: last.ok ? "ready" : "error" };
}
