const LOCALE = "pt-BR";

const currency = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "BRL" });
const compact = new Intl.NumberFormat(LOCALE, { notation: "compact", maximumFractionDigits: 1 });
const decimal = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 2 });

const DASH = "—";

export function formatCurrency(value: number | null | undefined) {
  return value == null ? DASH : currency.format(value);
}

export function formatCompact(value: number | null | undefined) {
  return value == null ? DASH : compact.format(value);
}

export function formatNumber(value: number | null | undefined) {
  return value == null ? DASH : decimal.format(value);
}

export function formatPercent(value: number | null | undefined) {
  if (value == null) return DASH;
  return `${value > 0 ? "+" : ""}${decimal.format(value)}%`;
}

export function formatDate(unixSeconds: number, options: Intl.DateTimeFormatOptions = { dateStyle: "short" }) {
  return new Intl.DateTimeFormat(LOCALE, { timeZone: "America/Sao_Paulo", ...options }).format(unixSeconds * 1000);
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(iso));
}
