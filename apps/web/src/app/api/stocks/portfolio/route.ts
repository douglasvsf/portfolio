import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { getCdiSince } from "@/lib/bcb/cdi";
import { TICKER_PATTERN } from "@/lib/portfolio/schema";
import { BrapiError } from "@/lib/stocks/brapi";
import { getPortfolioQuotes } from "@/lib/stocks/portfolio-quotes";

/**
 * GET /api/stocks/portfolio?tickers=PETR4,MXRF11&since=2025-01-15
 *
 * Só recebe tickers e a data da primeira operação — quantidades e preços da
 * carteira nunca saem do navegador.
 */

const MAX_TICKERS = 60;

const querySchema = z.object({
  tickers: z
    .string()
    .transform((value) => [...new Set(value.split(",").map((ticker) => ticker.trim().toUpperCase()).filter(Boolean))])
    .pipe(z.array(z.string().regex(TICKER_PATTERN)).min(1).max(MAX_TICKERS)),
  since: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((date) => date >= "1995-01-01" && date <= new Date().toISOString().slice(0, 10))
    .optional(),
});

export async function GET(request: NextRequest) {
  const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "invalid_query" }, { status: 400 });

  const { tickers, since } = parsed.data;
  try {
    const [{ quotes, missing }, cdi] = await Promise.all([getPortfolioQuotes(tickers), since ? getCdiSince(since) : null]);
    return NextResponse.json(
      { quotes, missing, cdi, updatedAt: new Date().toISOString() },
      // Cache curto no navegador; o pesado já está no Data Cache do servidor.
      { headers: { "Cache-Control": "private, max-age=60" } },
    );
  } catch (error) {
    const status = error instanceof BrapiError && error.code === "RATE_LIMITED" ? 429 : 502;
    return NextResponse.json({ error: "market_unavailable" }, { status });
  }
}
