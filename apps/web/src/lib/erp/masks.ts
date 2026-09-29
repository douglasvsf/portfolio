import { erp } from "@portfolio/shared";

/**
 * Máscaras dos campos do ERP, aplicadas enquanto a pessoa digita. Só formatam
 * e cortam o excesso: a validação de verdade continua no schema Zod (no BFF e
 * na API). Os limites saem dos mesmos schemas de @portfolio/shared.
 */

const digits = (value: string) => value.replace(/\D/g, "");

/** Limites de caracteres por campo — iguais aos da API. */
export const MAX_LENGTH = {
  sku: 20,
  /** EAN-13 */
  barcode: 13,
  productName: 80,
  customerName: 100,
  email: 120,
  city: 60,
  reason: 140,
  notes: 280,
  search: 80,
  /** "00.000.000/0000-00" */
  document: 18,
  /** "(00) 00000-0000" */
  phone: 15,
  /** "9.999.999,99" — R$ 9,9 milhões, abaixo do teto da API (R$ 10 milhões). */
  money: 12,
  /** "1.000.000,000" */
  quantity: 13,
} as const;

/** SKU: maiúsculas, letras, números e hífen. */
export const maskSku = (value: string) =>
  value
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, MAX_LENGTH.sku);

/** Código de barras / PLU: só dígitos, até 13. */
export const maskBarcode = (value: string) => digits(value).slice(0, MAX_LENGTH.barcode);

/** CPF até 11 dígitos; a partir do 12º vira CNPJ. */
export function maskDocument(value: string) {
  const d = digits(value).slice(0, 14);
  if (d.length <= 11) {
    return d
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
  }
  return d
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d{1,2})$/, "$1-$2");
}

/** Telefone com DDD: fixo (10 dígitos) ou celular (11). */
export function maskPhone(value: string) {
  const d = digits(value).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  const local = d.slice(2);
  const split = d.length === 11 ? 5 : 4;
  return `(${d.slice(0, 2)}) ${local.length > split ? `${local.slice(0, split)}-${local.slice(split)}` : local}`;
}

const money = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Dinheiro como em app de banco: os dígitos entram pelos centavos ("1290" → "12,90"). */
export function maskMoney(value: string) {
  const d = digits(value).replace(/^0+/, "").slice(0, 9);
  return d ? money.format(Number(d) / 100) : "";
}

/** Centavos → valor inicial já mascarado. */
export const centsToMasked = (cents: number) => maskMoney(String(cents));

const thousands = (integer: string) => integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

/** Quantidade: inteira para "un"; até 3 casas decimais para kg e L. Máximo 1 milhão. */
export function maskQuantity(value: string, unit: erp.Unit | undefined) {
  const text = value.replace(/\./g, "").replace(/[^\d,]/g, "");
  const [rawInteger = "", ...rest] = text.split(",");
  const integer = rawInteger.replace(/^0+(?=\d)/, "").slice(0, 7);
  const limited = Number(integer) > 1_000_000 ? "1000000" : integer;
  if (unit === "un" || rest.length === 0) return thousands(limited);
  return `${thousands(limited || "0")},${rest.join("").slice(0, 3)}`;
}

/** Quantidade numérica → valor inicial já mascarado. */
export const quantityToMasked = (value: number, unit: erp.Unit | undefined) => maskQuantity(String(value).replace(".", ","), unit);

export type MaskKind = "sku" | "barcode" | "document" | "phone" | "money" | "quantity-un" | "quantity-decimal";

export function applyMask(kind: MaskKind, value: string) {
  switch (kind) {
    case "sku":
      return maskSku(value);
    case "barcode":
      return maskBarcode(value);
    case "document":
      return maskDocument(value);
    case "phone":
      return maskPhone(value);
    case "money":
      return maskMoney(value);
    case "quantity-un":
      return maskQuantity(value, "un");
    case "quantity-decimal":
      return maskQuantity(value, "kg");
  }
}

export const quantityMask = (unit: erp.Unit | undefined): MaskKind => (unit === "un" ? "quantity-un" : "quantity-decimal");
