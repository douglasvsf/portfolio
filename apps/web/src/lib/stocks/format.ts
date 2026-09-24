import type { Locale } from "@/i18n/config";

const DASH = "—";
const TIME_ZONE = "America/Sao_Paulo";

/**
 * Formatadores do Kaiju Stocks para um idioma. A moeda é sempre BRL (B3) e o
 * fuso é o de São Paulo — só a notação muda com o idioma.
 */
export function createFormatters(locale: Locale) {
  const currency = new Intl.NumberFormat(locale, { style: "currency", currency: "BRL" });
  const compact = new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 1 });
  const currencyCompact = new Intl.NumberFormat(locale, { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 });
  const decimal = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  // Cripto: frações de moeda (0,0015 BTC) e preços abaixo de R$ 1 (tokens) precisam de mais casas.
  const quantity = new Intl.NumberFormat(locale, { maximumFractionDigits: 8 });
  const smallCurrency = new Intl.NumberFormat(locale, { style: "currency", currency: "BRL", minimumSignificantDigits: 2, maximumSignificantDigits: 4 });

  return {
    currency: (value: number | null | undefined) => (value == null ? DASH : currency.format(value)),
    compact: (value: number | null | undefined) => (value == null ? DASH : compact.format(value)),
    /** "R$ 8,8 tri" — valor de mercado de cripto. */
    currencyCompact: (value: number | null | undefined) => (value == null ? DASH : currencyCompact.format(value)),
    number: (value: number | null | undefined) => (value == null ? DASH : decimal.format(value)),
    quantity: (value: number | null | undefined) => (value == null ? DASH : quantity.format(value)),
    /** Preço unitário: 2 casas, ou até 4 algarismos significativos abaixo de R$ 1. */
    price: (value: number | null | undefined) => (value == null ? DASH : Math.abs(value) > 0 && Math.abs(value) < 1 ? smallCurrency.format(value) : currency.format(value)),
    percent: (value: number | null | undefined) => (value == null ? DASH : `${value > 0 ? "+" : ""}${decimal.format(value)}%`),
    integer: (value: number) => value.toLocaleString(locale),
    date: (unixSeconds: number, options: Intl.DateTimeFormatOptions = { dateStyle: "short" }) =>
      new Intl.DateTimeFormat(locale, { timeZone: TIME_ZONE, ...options }).format(unixSeconds * 1000),
    dateTime: (iso: string) =>
      new Intl.DateTimeFormat(locale, { timeZone: TIME_ZONE, dateStyle: "short", timeStyle: "short" }).format(new Date(iso)),
  };
}

export type Formatters = ReturnType<typeof createFormatters>;
