/**
 * Textos do Kaiju Stocks. Só strings (sem funções) para funcionar em Server e
 * Client Components; variáveis entre chaves são preenchidas com `fmt()`.
 */
export interface StocksDictionary {
  meta: { title: string; description: string };
  layout: { skipToContent: string; backToPortfolio: string; backShort: string; footer: string; dataSource: string };
  nav: { label: string; market: string; portfolio: string };
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
  portfolio: PortfolioDictionary;
  noSector: string;
  /** Tradução dos setores (a brapi envia em inglês). Setor ausente = nome original. */
  sectors: Record<string, string>;
}

/** Forma singular/plural — usada com `plural()`; {n} é a quantidade. */
export interface Plural {
  one: string;
  other: string;
}

export interface PortfolioDictionary {
  meta: { title: string; description: string };
  title: string;
  subtitle: string;
  privacy: string;
  actions: {
    add: string;
    import: string;
    backup: string;
    export: string;
    restore: string;
    clear: string;
    clearTitle: string;
    clearDescription: string;
    confirmClear: string;
    cancel: string;
  };
  empty: { title: string; description: string; demo: string };
  demoBanner: string;
  demoClear: string;
  summary: {
    label: string;
    marketValue: string;
    /** {value} = custo da posição. */
    marketValueHint: string;
    totalReturn: string;
    /** {value} = total aplicado. */
    totalReturnHint: string;
    unrealized: string;
    realized: string;
    income: string;
    cdi: string;
    /** {date} = início do período. */
    cdiHint: string;
    cdiUnavailable: string;
    disclaimer: string;
  };
  charts: {
    byAsset: string;
    byAssetDescription: string;
    byClass: string;
    byClassDescription: string;
    others: string;
    classes: { stock: string; fii: string; etf: string; bdr: string; crypto: string; other: string };
  };
  tabs: { positions: string; transactions: string };
  positions: {
    asset: string;
    quantity: string;
    averagePrice: string;
    price: string;
    day: string;
    value: string;
    result: string;
    weight: string;
    noQuote: string;
    oversold: string;
    closedTitle: string;
    closedDescription: string;
    realized: string;
    income: string;
  };
  transactions: {
    date: string;
    type: string;
    asset: string;
    quantity: string;
    price: string;
    total: string;
    remove: string;
    /** {ticker}, {date} */
    removeLabel: string;
    kinds: { buy: string; sell: string; bonus: string; merge: string; income: string };
  };
  form: {
    title: string;
    description: string;
    kind: string;
    ticker: string;
    tickerPlaceholder: string;
    tickerInvalid: string;
    tickerHint: string;
    date: string;
    dateInvalid: string;
    quantity: string;
    price: string;
    amount: string;
    fees: string;
    positive: string;
    total: string;
    submit: string;
    cancel: string;
  };
  importer: {
    title: string;
    description: string;
    steps: string[];
    file: string;
    localOnly: string;
    reading: string;
    unknownFormat: string;
    readError: string;
    found: Plural;
    skipped: Plural;
    skippedHint: string;
    confirm: string;
    cancel: string;
    done: Plural;
    duplicates: Plural;
  };
  restore: { invalid: string; done: Plural };
  market: {
    loading: string;
    error: string;
    /** {tickers} */
    missing: string;
    /** {time} */
    updatedAt: string;
    cryptoSource: string;
  };
}
