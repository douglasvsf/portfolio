import "server-only";
import type { AssetClass, MarketQuote } from "@/lib/portfolio/positions";
import { listStocks, type ListedStock } from "./brapi";

/**
 * Cotações para a carteira. O plano gratuito da brapi aceita 1 ativo por
 * requisição e 1 requisição por vez — uma carteira de 20 papéis seriam 20
 * chamadas em fila. Em vez disso, baixamos a lista inteira de ações e de
 * fundos (2 chamadas, ~200 KB cada) e deixamos no Data Cache do Next: todos
 * os visitantes compartilham as mesmas 2 requisições a cada 5 minutos.
 * BDRs só são buscados se a carteira tiver algum.
 */

const UNIVERSE_LIMIT = 2000;

function assetClassOf(stock: ListedStock): AssetClass {
  if (stock.type === "bdr") return "bdr";
  if (stock.type === "stock") return "stock";
  if (stock.subType === "fii") return "fii";
  if (stock.subType === "etf") return "etf";
  return "other";
}

function toQuote(stock: ListedStock): MarketQuote {
  return {
    price: stock.close,
    change: stock.change,
    name: stock.name,
    logo: stock.logo,
    sector: stock.sector,
    assetClass: assetClassOf(stock),
  };
}

async function universe(type: "stock" | "fund" | "bdr") {
  const { stocks } = await listStocks({ type, limit: UNIVERSE_LIMIT, sortBy: "volume", sortOrder: "desc" });
  return stocks;
}

export async function getPortfolioQuotes(tickers: readonly string[]) {
  const wanted = new Set(tickers);
  const quotes: Record<string, MarketQuote> = {};
  const collect = (stocks: ListedStock[]) => {
    for (const stock of stocks) if (wanted.has(stock.stock) && !quotes[stock.stock]) quotes[stock.stock] = toQuote(stock);
  };

  // Em sequência: o plano gratuito recusa requisições simultâneas.
  collect(await universe("stock"));
  collect(await universe("fund"));

  if (tickers.some((ticker) => !quotes[ticker])) collect(await universe("bdr"));

  return { quotes, missing: tickers.filter((ticker) => !quotes[ticker]) };
}
