import type { Transaction } from "./schema";

/**
 * Cálculo da carteira a partir das operações — funções puras, sem rede.
 *
 * Preço médio pelo método da Receita (custo médio ponderado): compras somam
 * quantidade e custo (com taxas); vendas baixam o custo pelo preço médio e
 * realizam a diferença; desdobros/bonificações aumentam a quantidade sem
 * custo; grupamentos trocam a quantidade mantendo o custo.
 */

const EPSILON = 1e-9;

export type PositionIssue = "oversold";

export interface Position {
  ticker: string;
  quantity: number;
  /** Custo da posição aberta (quantidade × preço médio). */
  cost: number;
  averagePrice: number;
  /** Lucro/prejuízo já realizado nas vendas. */
  realized: number;
  /** Proventos recebidos. */
  income: number;
  /** Total aplicado em compras (inclui o que já foi vendido). */
  bought: number;
  firstDate: string;
  issues: PositionIssue[];
}

/** Ordem estável: por data; no mesmo dia, entradas antes das saídas. */
const KIND_ORDER: Record<Transaction["kind"], number> = { buy: 0, bonus: 1, merge: 2, income: 3, sell: 4 };

export function sortTransactions(transactions: readonly Transaction[]) {
  return transactions
    .map((transaction, index) => ({ transaction, index }))
    .sort(
      (a, b) =>
        a.transaction.date.localeCompare(b.transaction.date) ||
        KIND_ORDER[a.transaction.kind] - KIND_ORDER[b.transaction.kind] ||
        a.index - b.index,
    )
    .map(({ transaction }) => transaction);
}

export function computePositions(transactions: readonly Transaction[]): Position[] {
  const byTicker = new Map<string, Position>();

  for (const transaction of sortTransactions(transactions)) {
    let position = byTicker.get(transaction.ticker);
    if (!position) {
      position = { ticker: transaction.ticker, quantity: 0, cost: 0, averagePrice: 0, realized: 0, income: 0, bought: 0, firstDate: transaction.date, issues: [] };
      byTicker.set(transaction.ticker, position);
    }

    switch (transaction.kind) {
      case "buy": {
        const total = transaction.quantity * transaction.price + transaction.fees;
        position.quantity += transaction.quantity;
        position.cost += total;
        position.bought += total;
        break;
      }
      case "sell": {
        const sold = Math.min(transaction.quantity, position.quantity);
        if (transaction.quantity - sold > EPSILON && !position.issues.includes("oversold")) position.issues.push("oversold");
        if (sold <= EPSILON) break;
        const average = position.cost / position.quantity;
        const proceeds = sold * transaction.price - transaction.fees * (sold / transaction.quantity);
        position.realized += proceeds - sold * average;
        position.cost -= sold * average;
        position.quantity -= sold;
        break;
      }
      case "bonus":
        position.quantity += transaction.quantity;
        break;
      case "merge":
        if (position.quantity > EPSILON) position.quantity = transaction.quantity;
        break;
      case "income":
        position.income += transaction.amount;
        break;
    }

    if (position.quantity <= EPSILON) {
      position.quantity = 0;
      position.cost = 0;
    }
    position.averagePrice = position.quantity > 0 ? position.cost / position.quantity : 0;
  }

  return [...byTicker.values()];
}

export interface MarketQuote {
  price: number | null;
  /** Variação do dia, em %. */
  change: number | null;
  name?: string;
  logo?: string | null;
  sector?: string | null;
  assetClass?: AssetClass;
}

export type AssetClass = "stock" | "fii" | "etf" | "bdr" | "other";

export interface ValuedPosition extends Position {
  price: number | null;
  change: number | null;
  name?: string;
  logo?: string | null;
  sector?: string | null;
  assetClass: AssetClass;
  /** Valor de mercado; sem cotação, usa o custo para não sumir do total. */
  marketValue: number;
  hasQuote: boolean;
  unrealized: number;
  unrealizedPercent: number | null;
  /** Participação no patrimônio, em %. */
  weight: number;
}

export interface PortfolioSummary {
  marketValue: number;
  cost: number;
  unrealized: number;
  realized: number;
  income: number;
  bought: number;
  /** Resultado total: não realizado + realizado + proventos. */
  totalReturn: number;
  /** Resultado total ÷ total aplicado, em %. */
  totalReturnPercent: number | null;
  firstDate: string | null;
}

export function valuePortfolio(positions: readonly Position[], quotes: Readonly<Record<string, MarketQuote | undefined>>) {
  const valued = positions.map((position) => {
    const quote = quotes[position.ticker];
    const price = quote?.price ?? null;
    const hasQuote = price != null && position.quantity > 0;
    const marketValue = hasQuote ? position.quantity * price : position.cost;
    const unrealized = hasQuote ? marketValue - position.cost : 0;
    return {
      ...position,
      price,
      change: quote?.change ?? null,
      name: quote?.name,
      logo: quote?.logo,
      sector: quote?.sector,
      assetClass: quote?.assetClass ?? guessAssetClass(position.ticker),
      marketValue,
      hasQuote,
      unrealized,
      unrealizedPercent: hasQuote && position.cost > 0 ? (unrealized / position.cost) * 100 : null,
      weight: 0,
    } satisfies ValuedPosition;
  });

  const open = valued.filter((position) => position.quantity > 0);
  const summary: PortfolioSummary = {
    marketValue: sum(open, (p) => p.marketValue),
    cost: sum(open, (p) => p.cost),
    unrealized: sum(open, (p) => p.unrealized),
    realized: sum(valued, (p) => p.realized),
    income: sum(valued, (p) => p.income),
    bought: sum(valued, (p) => p.bought),
    totalReturn: 0,
    totalReturnPercent: null,
    firstDate: valued.reduce<string | null>((first, p) => (first == null || p.firstDate < first ? p.firstDate : first), null),
  };
  summary.totalReturn = summary.unrealized + summary.realized + summary.income;
  summary.totalReturnPercent = summary.bought > 0 ? (summary.totalReturn / summary.bought) * 100 : null;

  for (const position of open) position.weight = summary.marketValue > 0 ? (position.marketValue / summary.marketValue) * 100 : 0;

  return {
    open: open.sort((a, b) => b.marketValue - a.marketValue),
    closed: valued.filter((position) => position.quantity === 0),
    summary,
  };
}

/** Sem dado da brapi: FIIs e ETFs terminam em 11, BDRs em 32–35/39. */
export function guessAssetClass(ticker: string): AssetClass {
  if (/(3[2-5]|39)$/.test(ticker)) return "bdr";
  if (/11$/.test(ticker)) return "fii";
  if (/\d$/.test(ticker)) return "stock";
  return "other";
}

export interface Slice {
  key: string;
  value: number;
}

/** Agrupa em fatias para os gráficos de rosca: as `max - 1` maiores + "outros". */
export function toSlices<T>(items: readonly T[], key: (item: T) => string, value: (item: T) => number, max = 6, othersKey = "others"): Slice[] {
  const totals = new Map<string, number>();
  for (const item of items) totals.set(key(item), (totals.get(key(item)) ?? 0) + value(item));
  const sorted = [...totals].map(([k, v]) => ({ key: k, value: v })).filter((slice) => slice.value > 0).sort((a, b) => b.value - a.value);
  if (sorted.length <= max) return sorted;
  const head = sorted.slice(0, max - 1);
  return [...head, { key: othersKey, value: sum(sorted.slice(max - 1), (slice) => slice.value) }];
}

function sum<T>(items: readonly T[], value: (item: T) => number) {
  return items.reduce((total, item) => total + value(item), 0);
}
