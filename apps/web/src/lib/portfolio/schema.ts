import { z } from "zod";
import { resilientArray } from "@/lib/http/contract";

/**
 * Modelo da carteira. Tudo fica no navegador do usuário (localStorage), então
 * o schema também protege contra dado velho ou editado à mão: o que não bate
 * é descartado na leitura, sem quebrar a tela.
 */

/** Código de negociação da B3: PETR4, MXRF11, BOVA11, AAPL34… */
export const TICKER_PATTERN = /^[A-Z]{4}\d{1,2}$/;

const ticker = z
  .string()
  .trim()
  .toUpperCase()
  .regex(TICKER_PATTERN, "ticker inválido");

/** "2025-02-30" tem o formato certo, mas não existe. */
export function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Data do pregão, sem fuso: "2025-03-14". */
const isoDate = z.string().refine(isValidIsoDate, "data inválida");

const base = {
  id: z.string().min(1),
  ticker,
  date: isoDate,
  /** Origem do lançamento — "demo" identifica a carteira de exemplo. */
  source: z.enum(["manual", "b3", "demo"]).catch("manual"),
};

const positive = z.number().finite().positive();

export const transactionSchema = z.discriminatedUnion("kind", [
  /** Compra: custo = quantidade × preço + taxas. */
  z.object({ ...base, kind: z.literal("buy"), quantity: positive, price: positive, fees: z.number().finite().min(0).default(0) }),
  /** Venda: realiza lucro/prejuízo contra o preço médio. */
  z.object({ ...base, kind: z.literal("sell"), quantity: positive, price: positive, fees: z.number().finite().min(0).default(0) }),
  /** Desdobro ou bonificação: ações novas sem custo. */
  z.object({ ...base, kind: z.literal("bonus"), quantity: positive }),
  /** Grupamento: a quantidade passa a ser `quantity`, o custo total se mantém. */
  z.object({ ...base, kind: z.literal("merge"), quantity: positive }),
  /** Provento (dividendo, JCP, rendimento de FII): valor recebido. */
  z.object({ ...base, kind: z.literal("income"), amount: positive }),
]);

export type Transaction = z.output<typeof transactionSchema>;
export type TransactionKind = Transaction["kind"];
export type TradeTransaction = Extract<Transaction, { kind: "buy" | "sell" }>;

export const STORE_VERSION = 1;

export const portfolioSchema = z.object({
  version: z.literal(STORE_VERSION),
  transactions: resilientArray(transactionSchema, "carteira (localStorage)"),
});

export type PortfolioData = z.output<typeof portfolioSchema>;

export const emptyPortfolio = (): PortfolioData => ({ version: STORE_VERSION, transactions: [] });

/** Chave usada para não importar duas vezes a mesma operação. */
export function transactionFingerprint(transaction: Transaction) {
  const value = "amount" in transaction ? transaction.amount : `${transaction.quantity}@${"price" in transaction ? transaction.price : 0}`;
  return [transaction.date, transaction.ticker, transaction.kind, value].join("|");
}

let counter = 0;
/** Id local, único o bastante para uma carteira pessoal. */
export function newTransactionId() {
  counter += 1;
  return `${Date.now().toString(36)}-${counter.toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
