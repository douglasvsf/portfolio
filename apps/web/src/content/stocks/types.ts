/**
 * Textos do Kaiju Stocks. Só strings (sem funções) para funcionar em Server e
 * Client Components; variáveis entre chaves são preenchidas com `fmt()`.
 */
export interface StocksDictionary {
  meta: { title: string; description: string };
  layout: { skipToContent: string; backToPortfolio: string; backShort: string; footer: string; dataSource: string };
  market: {
    title: string;
    /** {n} = tamanho do universo (100). */
    subtitle: string;
    freeTickers: string;
    summaryLabel: string;
    up: string;
    down: string;
    /** {n} = quantidade de ações analisadas. */
    ofMostTraded: string;
    averageChange: string;
    averageChangeHint: string;
    totalVolume: string;
    totalVolumeHint: string;
    moversTitle: string;
    moversDescription: string;
    sectorsTitle: string;
    sectorsDescription: string;
    others: string;
    allStocks: string;
    allStocksHint: string;
  };
  filters: { searchPlaceholder: string; searchLabel: string; sectorLabel: string; allSectors: string };
  table: {
    asset: string;
    price: string;
    day: string;
    volume: string;
    marketCap: string;
    sector: string;
    empty: string;
    /** {total}, {page}, {pages} */
    pagination: string;
    paginationLabel: string;
    previous: string;
    next: string;
  };
  detail: {
    back: string;
    /** {date} */
    updatedAt: string;
    indicators: string;
    open: string;
    previousClose: string;
    dayRange: string;
    yearRange: string;
    volume: string;
    marketCap: string;
    pe: string;
    eps: string;
    quote: string;
    periodChange: string;
    min: string;
    max: string;
    rangeLabel: string;
    proRanges: string;
    tradedVolume: string;
    noHistory: string;
    history: string;
    /** {n} */
    lastSessions: string;
    date: string;
    low: string;
    high: string;
    close: string;
    /** {ticker} */
    needsToken: string;
    /** {tickers} */
    needsTokenDescription: string;
    unavailable: string;
    tryAgain: string;
    ranges: Record<"5d" | "1mo" | "3mo" | "1y" | "5y", string>;
  };
  charts: { change: string; close: string; volume: string };
  states: { notFound: string; backToMarket: string; errorTitle: string; errorDescription: string; retry: string };
  noSector: string;
  /** Tradução dos setores (a brapi envia em inglês). Setor ausente = nome original. */
  sectors: Record<string, string>;
}
