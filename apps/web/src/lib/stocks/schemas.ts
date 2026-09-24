import { z } from "zod";
import { resilientArray } from "@/lib/http/contract";
import type { HistoricalPrice, ListedStock, Quote, QuoteListResponse } from "./brapi";

/**
 * Contrato das respostas da brapi. O essencial (ticker, preço) é exigido; o
 * que é só enfeite (logo, setor, indicadores) vira `null` quando some ou muda
 * de tipo — a tela mostra "—" em vez de quebrar.
 */

/** Número opcional: ausente, `null` ou lixo viram `null`. */
const maybeNumber = z.number().nullable().catch(null);
const maybeString = z.string().nullable().catch(null);

const listedStock: z.ZodType<ListedStock> = z.object({
  stock: z.string().min(1),
  name: z.string().catch(""),
  close: maybeNumber,
  change: maybeNumber,
  volume: maybeNumber,
  market_cap: maybeNumber,
  logo: maybeString,
  sector: maybeString,
  type: z.string().catch("stock"),
  subType: maybeString.optional(),
});

export const quoteListSchema: z.ZodType<QuoteListResponse> = z.object({
  stocks: resilientArray(listedStock, "brapi /quote/list"),
  availableSectors: z.array(z.string()).catch([]),
  currentPage: z.number().int().positive(),
  totalPages: z.number().int().nonnegative(),
  totalCount: z.number().int().nonnegative(),
  hasNextPage: z.boolean(),
});

const historicalPrice: z.ZodType<HistoricalPrice> = z.object({
  date: z.number().int().positive(),
  open: maybeNumber,
  high: maybeNumber,
  low: maybeNumber,
  close: maybeNumber,
  volume: maybeNumber,
});

const quote: z.ZodType<Quote> = z.object({
  symbol: z.string().min(1),
  shortName: z.string().catch(""),
  longName: z.string().catch(""),
  currency: z.string().catch("BRL"),
  logourl: z.string().optional().catch(undefined),
  regularMarketPrice: z.number(),
  regularMarketChange: z.number(),
  regularMarketChangePercent: z.number(),
  regularMarketTime: z.string(),
  regularMarketOpen: z.number(),
  regularMarketDayHigh: z.number(),
  regularMarketDayLow: z.number(),
  regularMarketPreviousClose: z.number(),
  regularMarketVolume: z.number(),
  marketCap: maybeNumber,
  fiftyTwoWeekLow: z.number(),
  fiftyTwoWeekHigh: z.number(),
  priceEarnings: maybeNumber,
  earningsPerShare: maybeNumber,
  historicalDataPrice: resilientArray(historicalPrice, "brapi /quote historicalDataPrice").optional(),
});

export const quoteResultsSchema = z.object({
  results: z.array(quote),
});
