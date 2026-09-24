import "server-only";
import { z } from "zod";
import { ContractError, parseContract, resilientArray } from "@/lib/http/contract";
import { withRetry } from "@/lib/http/retry";
import type { MarketQuote } from "@/lib/portfolio/positions";

/**
 * Cotações de cripto em reais pela CoinGecko (Demo API, gratuita).
 *
 * Mesma estratégia da brapi: uma única chamada traz as 250 maiores moedas
 * por valor de mercado e fica no Data Cache do Next, compartilhada por todos
 * os visitantes. Com 10 min de cache são no máximo ~4.300 chamadas/mês — o
 * plano Demo permite 10 mil. A chave fica só no servidor.
 */

const MARKETS_URL = "https://api.coingecko.com/api/v3/coins/markets";
const REVALIDATE_SECONDS = 600;
const TIMEOUT_MS = 8000;
const UNIVERSE = 250;

export function isCoingeckoConfigured(env: NodeJS.ProcessEnv = process.env) {
  return Boolean(env.COINGECKO_API_KEY);
}

const coinSchema = z.object({
  id: z.string().min(1),
  symbol: z.string().min(1),
  name: z.string().catch(""),
  image: z.string().nullable().catch(null),
  current_price: z.number().nonnegative(),
  price_change_percentage_24h: z.number().nullable().catch(null),
  market_cap: z.number().nullable().catch(null),
  market_cap_rank: z.number().int().positive().nullable().catch(null),
  total_volume: z.number().nullable().catch(null),
});

export type Coin = z.output<typeof coinSchema>;

const marketsSchema = resilientArray(coinSchema, "coingecko /coins/markets");

class CoingeckoError extends Error {
  constructor(readonly transient: boolean, message: string) {
    super(message);
  }
}

async function fetchMarkets(apiKey: string) {
  const url = `${MARKETS_URL}?vs_currency=brl&order=market_cap_desc&per_page=${UNIVERSE}&page=1`;
  const body = await withRetry(
    async () => {
      let response: Response;
      try {
        response = await fetch(url, {
          headers: { "x-cg-demo-api-key": apiKey, accept: "application/json" },
          signal: AbortSignal.timeout(TIMEOUT_MS),
          next: { revalidate: REVALIDATE_SECONDS },
        });
      } catch {
        throw new CoingeckoError(true, "Falha de rede na CoinGecko");
      }
      if (!response.ok) throw new CoingeckoError(response.status >= 500 || response.status === 429, `CoinGecko respondeu ${response.status}`);
      return response.json().catch(() => {
        throw new CoingeckoError(false, "JSON inválido da CoinGecko");
      });
    },
    { retryable: (error) => ({ retry: error instanceof CoingeckoError && error.transient }) },
  );
  return parseContract(marketsSchema, body, "coingecko /coins/markets");
}

/**
 * As 250 maiores moedas por valor de mercado, em reais (já em cache). Sem
 * chave ou com a CoinGecko fora do ar, `null` — quem chama decide o que
 * esconder. Serve a carteira e a seção de cripto do Mercado.
 */
export async function getTopCoins(): Promise<Coin[] | null> {
  const apiKey = process.env.COINGECKO_API_KEY;
  if (!apiKey) return null;
  try {
    return await fetchMarkets(apiKey);
  } catch (error) {
    if (error instanceof CoingeckoError || error instanceof ContractError) return null;
    throw error;
  }
}

/**
 * Cotação por símbolo (BTC, ETH…). Símbolos repetidos ficam com a moeda de
 * maior valor de mercado — a lista já vem nessa ordem. Sem chave ou com a
 * CoinGecko fora do ar, tudo volta em `missing` (a tela mostra pelo custo).
 */
export async function getCryptoQuotes(symbols: readonly string[]): Promise<{ quotes: Record<string, MarketQuote>; missing: string[] }> {
  if (symbols.length === 0) return { quotes: {}, missing: [] };
  const coins = await getTopCoins();
  if (!coins) return { quotes: {}, missing: [...symbols] };

  const wanted = new Set(symbols);
  const quotes: Record<string, MarketQuote> = {};
  for (const coin of coins) {
    const symbol = coin.symbol.toUpperCase();
    if (!wanted.has(symbol) || quotes[symbol]) continue;
    quotes[symbol] = {
      price: coin.current_price,
      change: coin.price_change_percentage_24h,
      name: coin.name,
      logo: coin.image,
      sector: null,
      assetClass: "crypto",
    };
  }
  return { quotes, missing: symbols.filter((symbol) => !quotes[symbol]) };
}
