import { erp } from "@portfolio/shared";

/**
 * Regras do caixa (PDV) no navegador: interpretar o que foi "bipado", montar
 * o carrinho e conferir os pagamentos. Funções puras — a tela só chama.
 * A API refaz todas as contas; aqui é para a pessoa ver na hora.
 */

export interface CartLine {
  productId: string;
  quantity: number;
}

export type ScanOutcome =
  | { type: "add"; product: erp.Product; quantity: number }
  | { type: "choose"; matches: erp.Product[]; multiplier: number }
  | { type: "error"; message: string };

const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

const round3 = (value: number) => Math.round(value * 1000) / 1000;

export function barcodeIndex(products: erp.Product[]) {
  return new Map(products.filter((product) => product.barcode).map((product) => [product.barcode!, product]));
}

/** Código de barras, etiqueta da balança, PLU, "3*código" ou parte do nome/SKU. */
export function resolveScan(input: string, products: erp.Product[], index = barcodeIndex(products)): ScanOutcome | null {
  const scan = erp.parseScanInput(input);
  if (!scan) return null;

  if (scan.kind === "scale") {
    const product = index.get(scan.plu);
    if (!product || product.unit !== "kg") return { type: "error", message: `Etiqueta de balança com PLU ${scan.plu} não cadastrado` };
    if (scan.grams <= 0) return { type: "error", message: "Etiqueta de balança sem peso" };
    return { type: "add", product, quantity: round3(scan.grams / 1000) };
  }

  if (scan.kind === "ean") {
    const product = index.get(scan.code);
    return product ? { type: "add", product, quantity: scan.multiplier } : { type: "error", message: `Código ${scan.code} não encontrado` };
  }

  const term = normalize(scan.text);
  const matches = products.filter((product) => normalize(product.name).includes(term) || product.sku.toLowerCase().includes(term)).slice(0, 8);
  if (matches.length === 0) return { type: "error", message: `Nenhum produto para "${scan.text}"` };
  if (matches.length === 1) return { type: "add", product: matches[0]!, quantity: scan.multiplier };
  return { type: "choose", matches, multiplier: scan.multiplier };
}

/** Soma ao item que já está no carrinho (como no caixa: bipar de novo aumenta). */
export function addToCart(lines: CartLine[], product: erp.Product, quantity: number): CartLine[] {
  const qty = product.unit === "un" ? Math.max(1, Math.round(quantity)) : round3(quantity);
  const existing = lines.find((line) => line.productId === product.id);
  if (!existing) return [...lines, { productId: product.id, quantity: qty }];
  return lines.map((line) => (line.productId === product.id ? { ...line, quantity: round3(line.quantity + qty) } : line));
}

export function cartTotals(lines: CartLine[], byId: Map<string, erp.Product>, discountCents: number) {
  const rows = lines.map((line) => {
    const product = byId.get(line.productId)!;
    return { ...line, product, totalCents: Math.round(product.priceCents * line.quantity), overStock: line.quantity > product.stock };
  });
  const subtotalCents = rows.reduce((sum, row) => sum + row.totalCents, 0);
  const discount = Math.min(Math.max(0, discountCents || 0), subtotalCents);
  return { rows, subtotalCents, discountCents: discount, totalCents: subtotalCents - discount };
}

/** Mesma regra da API: cartão e Pix não passam do total; só dinheiro vira troco. */
export function paymentSummary(payments: erp.Payment[], totalCents: number) {
  const paidCents = payments.reduce((sum, payment) => sum + payment.amountCents, 0);
  const nonCashCents = payments.filter((payment) => payment.method !== "cash").reduce((sum, payment) => sum + payment.amountCents, 0);
  const remainingCents = Math.max(0, totalCents - paidCents);
  const changeCents = Math.max(0, paidCents - totalCents);
  const error = nonCashCents > totalCents ? "Cartão e Pix não podem passar do total — o que sobrar precisa ser em dinheiro." : undefined;
  return { paidCents, remainingCents, changeCents, error, complete: totalCents > 0 && remainingCents === 0 && !error };
}

/** Chave de idempotência nova para cada venda. */
export const newSaleKey = () => `pdv-${crypto.randomUUID()}`;
