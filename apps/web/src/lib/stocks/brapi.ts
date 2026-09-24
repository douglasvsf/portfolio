import "server-only";

/**
 * Cliente mínimo da brapi (https://brapi.dev) — API pública de cotações da B3.
 *
 * Roda só no servidor: o token (opcional) nunca vai para o navegador e as
 * respostas ficam em cache pelo Data Cache do Next por alguns minutos.
 *
 * Sem token, `/quote/list` funciona para todos os ativos, mas `/quote/{ticker}`
 * só responde para os tickers de teste abaixo.
 */

const BASE_URL = "https://brapi.dev/api";
const REVALIDATE_SECONDS = 300;

export const FREE_TICKERS = ["PETR4", "VALE3", "ITUB4", "MGLU3"] as const;

export const hasToken = Boolean(process.env.BRAPI_TOKEN);

export class BrapiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "BrapiError";
  }
}

async function request<T>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }

  const headers: HeadersInit = {};
  if (process.env.BRAPI_TOKEN) headers.Authorization = `Bearer ${process.env.BRAPI_TOKEN}`;

  const response = await fetch(url, { headers, next: { revalidate: REVALIDATE_SECONDS } });
  const body = await response.json().catch(() => null);

  if (!response.ok || body?.error) {
    throw new BrapiError(body?.message ?? `Erro ${response.status} na brapi`, body?.code ?? "UNKNOWN", response.status);
  }
  return body as T;
}

// ---- /quote/list --------------------------------------------------------

export interface ListedStock {
  stock: string;
  name: string;
  close: number | null;
  change: number | null;
  volume: number | null;
  market_cap: number | null;
  logo: string | null;
  sector: string | null;
  type: string;
}

export interface QuoteListResponse {
  stocks: ListedStock[];
  availableSectors: string[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  hasNextPage: boolean;
}

export const sortFields = ["name", "close", "change", "volume", "market_cap_basic"] as const;
export type SortField = (typeof sortFields)[number];

export interface ListParams {
  search?: string;
  sector?: string;
  sortBy?: SortField;
  sortOrder?: "asc" | "desc";
  page?: number;
  limit?: number;
}

export function listStocks({ limit = 20, page = 1, ...params }: ListParams = {}) {
  return request<QuoteListResponse>("/quote/list", { type: "stock", limit, page, ...params });
}

// ---- /quote/{ticker} ----------------------------------------------------

export interface HistoricalPrice {
  /** Unix timestamp em segundos. */
  date: number;
  open: number | null;
  high: number | null;
  low: number | null;
  close: number | null;
  volume: number | null;
}

export interface Quote {
  symbol: string;
  shortName: string;
  longName: string;
  currency: string;
  logourl?: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketTime: string;
  regularMarketOpen: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketPreviousClose: number;
  regularMarketVolume: number;
  marketCap: number | null;
  fiftyTwoWeekLow: number;
  fiftyTwoWeekHigh: number;
  priceEarnings: number | null;
  earningsPerShare: number | null;
  historicalDataPrice?: HistoricalPrice[];
}

/** Períodos oferecidos na tela, com o intervalo de vela adequado a cada um. */
export const ranges = {
  "5d": { label: "5D", interval: "1d" },
  "1mo": { label: "1M", interval: "1d" },
  "3mo": { label: "3M", interval: "1d" },
  "1y": { label: "1A", interval: "1d" },
  "5y": { label: "5A", interval: "1mo" },
} as const;

export type Range = keyof typeof ranges;

export function isRange(value: unknown): value is Range {
  return typeof value === "string" && value in ranges;
}

/** Períodos liberados pelo plano gratuito da brapi (com token) para qualquer ação. */
const FREE_PLAN_RANGES: readonly Range[] = ["5d", "1mo", "3mo"];

export function isFreeTicker(ticker: string) {
  return (FREE_TICKERS as readonly string[]).includes(ticker);
}

/**
 * Períodos que funcionam para o ativo: os tickers de teste liberam tudo; os
 * demais, com token do plano gratuito, só até 3 meses (1A/5A exigem o Pro).
 */
export function availableRanges(ticker: string): Range[] {
  const all = Object.keys(ranges) as Range[];
  return isFreeTicker(ticker) ? all : all.filter((range) => FREE_PLAN_RANGES.includes(range));
}

export async function getQuote(ticker: string, range: Range) {
  const { results } = await request<{ results: Quote[] }>(`/quote/${encodeURIComponent(ticker)}`, {
    range,
    interval: ranges[range].interval,
  });
  const quote = results[0];
  if (!quote) throw new BrapiError("Ativo não encontrado", "NOT_FOUND", 404);
  return quote;
}
