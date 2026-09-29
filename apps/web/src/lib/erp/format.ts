import { erp } from "@portfolio/shared";

/** Formatação do ERP (só pt-BR; dinheiro chega em centavos). */

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const brlCompact = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 });
const decimal = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 3 });
const dateTime = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });
const dateOnly = new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short" });
const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "short", year: "2-digit", timeZone: "UTC" });

export const money = (cents: number) => brl.format(cents / 100);
export const moneyCompact = (cents: number) => brlCompact.format(cents / 100);
export const quantity = (value: number, unit?: erp.Unit) => `${decimal.format(value)}${unit ? ` ${erp.UNIT_LABELS[unit]}` : ""}`;
export const formatDateTime = (iso: string) => dateTime.format(new Date(iso));
export const formatDate = (iso: string) => dateOnly.format(new Date(iso));
/** "2026-04" → "abr. de 26". */
export const formatMonth = (month: string) => monthLabel.format(new Date(`${month}-01T00:00:00Z`)).replace(" de ", "/");

/** "12,90" / "12.90" / "1.234,56" → 1290 centavos. `NaN` se não for número. */
export function parseMoneyToCents(value: string) {
  const text = value.replace(/R\$|\s/g, "");
  if (!/\d/.test(text)) return Number.NaN;
  const normalized = text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text;
  const number = Number(normalized);
  return Number.isFinite(number) ? Math.round(number * 100) : Number.NaN;
}

/** "1,25" / "1.25" → 1.25. */
export function parseQuantity(value: string) {
  const text = value.trim().replace(/\s/g, "");
  if (!/\d/.test(text)) return Number.NaN;
  return Number(text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text);
}

/** Quanto falta para a demo expirar ("23 h", "40 min"). */
export function timeLeft(expiresAt: string, now = Date.now()) {
  const minutes = Math.max(0, Math.round((new Date(expiresAt).getTime() - now) / 60_000));
  return minutes >= 60 ? `${Math.floor(minutes / 60)} h` : `${minutes} min`;
}
