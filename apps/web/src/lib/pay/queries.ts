import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { pay } from "@portfolio/shared";
import { erpRequest, isApiError } from "@/lib/erp/client";
import { getPaySession, type PaySession } from "./session";

/**
 * Leituras das telas do Pay (Server Components). Sem loja, ou com a loja
 * vencida (a API recusa a chave), volta para a entrada com o aviso.
 */

export const currentPaySession = cache(getPaySession);

export async function requirePaySession(): Promise<PaySession> {
  const session = await currentPaySession();
  if (!session) redirect("/pay?expirou=1");
  return session;
}

async function load<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T> {
  const session = await requirePaySession();
  try {
    return await erpRequest<T>(path, { token: session.apiKey, query });
  } catch (error) {
    if (isApiError(error, "unauthorized")) redirect("/pay?expirou=1");
    throw error;
  }
}

export const getMerchant = () => load<pay.Merchant>("/pay/merchant");
export const getBalance = () => load<pay.Balance>("/pay/balance");
export const listCharges = (query: { status?: string; page?: number }) => load<{ items: pay.Charge[]; page: number; pageSize: number; total: number }>("/pay/charges", { ...query, pageSize: 15 });
export const getLedger = (chargeId?: string) => load<pay.LedgerEntry[]>("/pay/ledger", { chargeId });
export const listDeliveries = () => load<pay.WebhookDelivery[]>("/pay/webhooks/deliveries");
export const listInspector = () => load<pay.InspectorRequest[]>("/pay/webhooks/inspector");

export async function getCharge(id: string): Promise<pay.Charge | null> {
  try {
    return await load<pay.Charge>(`/pay/charges/${encodeURIComponent(id)}`);
  } catch (error) {
    if (isApiError(error, "not_found") || isApiError(error, "validation_error")) return null;
    throw error;
  }
}
