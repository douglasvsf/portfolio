import { newTransactionId, TICKER_PATTERN, transactionSchema, type Transaction } from "./schema";

/**
 * Importa as planilhas da Área do Investidor da B3 (investidor.b3.com.br).
 * A leitura do .xlsx acontece no navegador; aqui só chegam as linhas já
 * lidas (`unknown[][]`), o que deixa o parser puro e testável.
 *
 * Formatos aceitos (detectados pelo cabeçalho):
 * - **Movimentação** — Entrada/Saída · Data · Movimentação · Produto ·
 *   Instituição · Quantidade · Preço unitário · Valor da Operação. Traz
 *   compras/vendas ("Transferência - Liquidação", na data de liquidação),
 *   proventos, desdobros e grupamentos.
 * - **Negociação** — Data do Negócio · Tipo de Movimentação · Mercado ·
 *   Prazo/Vencimento · Instituição · Código de Negociação · Quantidade ·
 *   Preço · Valor. Só compras e vendas, na data do pregão.
 */

export type B3Format = "movements" | "trades";

export type SkipReason = "unsupported" | "notAsset" | "invalid";

export interface SkippedRow {
  /** Linha na planilha (1 = cabeçalho). */
  row: number;
  reason: SkipReason;
  /** Tipo de movimentação original, para o usuário entender o que ficou de fora. */
  label: string;
}

export interface B3ImportResult {
  format: B3Format | null;
  transactions: Transaction[];
  skipped: SkippedRow[];
}

const MOVEMENT_HEADERS = { side: "entrada/saida", date: "data", type: "movimentacao", product: "produto", quantity: "quantidade", unitPrice: "preco unitario", total: "valor da operacao" } as const;
const TRADE_HEADERS = { date: "data do negocio", type: "tipo de movimentacao", ticker: "codigo de negociacao", quantity: "quantidade", price: "preco", total: "valor" } as const;

/** Movimentações que viram operação na carteira (nomes normalizados). */
const MOVEMENT_KINDS: Record<string, "trade" | "bonus" | "merge" | "income"> = {
  "transferencia - liquidacao": "trade",
  desdobro: "bonus",
  "bonificacao em ativos": "bonus",
  grupamento: "merge",
  dividendo: "income",
  rendimento: "income",
  "juros sobre capital proprio": "income",
};

export function parseB3Rows(rows: readonly (readonly unknown[])[]): B3ImportResult {
  const headerIndex = rows.findIndex((row) => detectFormat(row) != null);
  if (headerIndex < 0) return { format: null, transactions: [], skipped: [] };

  const header = rows[headerIndex].map((cell) => normalize(String(cell ?? "")));
  const format = detectFormat(rows[headerIndex])!;
  const result: B3ImportResult = { format, transactions: [], skipped: [] };

  rows.slice(headerIndex + 1).forEach((row, offset) => {
    if (row.every((cell) => cell == null || String(cell).trim() === "")) return;
    const line = headerIndex + offset + 2;
    const parsed = format === "movements" ? parseMovement(row, header) : parseTrade(row, header);
    if ("reason" in parsed) {
      result.skipped.push({ row: line, reason: parsed.reason, label: parsed.label });
      return;
    }
    const valid = transactionSchema.safeParse(parsed.transaction);
    if (valid.success) result.transactions.push(valid.data);
    else result.skipped.push({ row: line, reason: "invalid", label: parsed.label });
  });

  return result;
}

type Parsed = { transaction: Record<string, unknown>; label: string } | { reason: SkipReason; label: string };

function parseMovement(row: readonly unknown[], header: string[]): Parsed {
  const cell = (name: keyof typeof MOVEMENT_HEADERS) => row[header.indexOf(MOVEMENT_HEADERS[name])];
  const label = String(cell("type") ?? "").trim();
  const kind = MOVEMENT_KINDS[normalize(label)];
  if (!kind) return { reason: "unsupported", label };

  const ticker = tickerFromProduct(cell("product"));
  if (!ticker) return { reason: "notAsset", label };

  const base = { id: newTransactionId(), ticker, date: parseDate(cell("date")), source: "b3" };
  const quantity = parseNumber(cell("quantity"));

  if (kind === "income") return { transaction: { ...base, kind: "income", amount: parseNumber(cell("total")) }, label };
  if (kind === "bonus" || kind === "merge") return { transaction: { ...base, kind, quantity }, label };

  const side = normalize(String(cell("side") ?? ""));
  const tradeKind = side.startsWith("credito") ? "buy" : side.startsWith("debito") ? "sell" : null;
  if (!tradeKind) return { reason: "invalid", label };
  return { transaction: { ...base, kind: tradeKind, quantity, price: priceOf(cell("unitPrice"), cell("total"), quantity), fees: 0 }, label };
}

function parseTrade(row: readonly unknown[], header: string[]): Parsed {
  const cell = (name: keyof typeof TRADE_HEADERS) => row[header.indexOf(TRADE_HEADERS[name])];
  const label = String(cell("type") ?? "").trim();
  const type = normalize(label);
  const kind = type === "compra" ? "buy" : type === "venda" ? "sell" : null;
  if (!kind) return { reason: "unsupported", label };

  const ticker = normalizeTicker(cell("ticker"));
  if (!ticker) return { reason: "notAsset", label };

  const quantity = parseNumber(cell("quantity"));
  return {
    transaction: { id: newTransactionId(), ticker, date: parseDate(cell("date")), source: "b3", kind, quantity, price: priceOf(cell("price"), cell("total"), quantity), fees: 0 },
    label,
  };
}

function detectFormat(row: readonly unknown[]): B3Format | null {
  const cells = new Set(row.map((cell) => normalize(String(cell ?? ""))));
  if (Object.values(TRADE_HEADERS).every((name) => cells.has(name))) return "trades";
  if (Object.values(MOVEMENT_HEADERS).every((name) => cells.has(name))) return "movements";
  return null;
}

/** Minúsculas, sem acento e com espaços simples: "Preço  unitário" → "preco unitario". */
function normalize(value: string) {
  return value.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();
}

/** "PETR4 - PETROLEO BRASILEIRO S.A. PETROBRAS" → "PETR4". Renda fixa e Tesouro ficam de fora. */
function tickerFromProduct(value: unknown) {
  return normalizeTicker(String(value ?? "").split(" - ")[0]);
}

/** Mercado fracionário usa o sufixo F (PETR4F): é o mesmo ativo. */
export function normalizeTicker(value: unknown) {
  const ticker = String(value ?? "").trim().toUpperCase().replace(/(\d)F$/, "$1");
  return TICKER_PATTERN.test(ticker) ? ticker : null;
}

/** Aceita número, "1.234,56", "R$ 38,50" e "-" (vira NaN, barrado pelo schema). */
export function parseNumber(value: unknown): number {
  if (typeof value === "number") return value;
  const text = String(value ?? "").replace(/R\$|\s/g, "");
  if (!/\d/.test(text)) return Number.NaN;
  return Number(text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text);
}

/** Preço unitário; quando a B3 manda "-", deriva de valor total ÷ quantidade. */
function priceOf(unit: unknown, total: unknown, quantity: number) {
  const price = parseNumber(unit);
  if (Number.isFinite(price) && price > 0) return price;
  const value = parseNumber(total);
  return Number.isFinite(value) && quantity > 0 ? value / quantity : Number.NaN;
}

/** Date (célula de data do Excel) ou "dd/mm/aaaa" → "aaaa-mm-dd". */
export function parseDate(value: unknown): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(String(value ?? "").trim());
  return match ? `${match[3]}-${match[2]}-${match[1]}` : "";
}
