import type { Transaction } from "./schema";

type DemoEntry =
  | [date: string, kind: "buy" | "sell", ticker: string, quantity: number, price: number]
  | [date: string, kind: "income", ticker: string, amount: number];

/**
 * Carteira de exemplo para quem visita o portfólio: ações, FII e ETF, com
 * uma venda (lucro realizado) e proventos. Preços aproximados da época.
 */
const ENTRIES: DemoEntry[] = [
  ["2025-01-15", "buy", "PETR4", 100, 37.2],
  ["2025-01-20", "buy", "MXRF11", 300, 9.35],
  ["2025-02-10", "buy", "VALE3", 50, 56.8],
  ["2025-03-05", "buy", "ITUB4", 80, 33.1],
  ["2025-04-22", "buy", "WEGE3", 40, 45.3],
  ["2025-06-02", "buy", "BOVA11", 30, 128.4],
  ["2025-07-14", "buy", "PETR4", 50, 31.9],
  ["2025-09-15", "income", "MXRF11", 27],
  ["2025-10-15", "income", "MXRF11", 27],
  ["2025-11-10", "sell", "PETR4", 40, 34.5],
  ["2025-12-19", "income", "ITUB4", 36.4],
  ["2026-02-20", "income", "PETR4", 58.2],
  ["2026-03-16", "buy", "MXRF11", 200, 9.6],
];

export function demoTransactions(): Transaction[] {
  return ENTRIES.map((entry, index) => {
    const base = { id: `demo-${index}`, date: entry[0], ticker: entry[2], source: "demo" as const };
    return entry[1] === "income"
      ? { ...base, kind: "income", amount: entry[3] }
      : { ...base, kind: entry[1], quantity: entry[3], price: entry[4], fees: 0 };
  });
}
