import "server-only";
import { redirect } from "next/navigation";
import type { erp } from "@portfolio/shared";
import { erpRequest, isApiError } from "./client";
import { getSession } from "./session";

/**
 * Leituras das páginas do ERP (Server Components). Sem sessão ou com sessão
 * vencida, volta para a entrada da demo — Server Components não podem apagar
 * cookie, então a entrada mostra "sua demo expirou" e cria outra.
 */

async function load<T>(path: string, query?: Record<string, string | number | boolean | undefined>): Promise<T> {
  try {
    return await erpRequest<T>(path, { query });
  } catch (error) {
    if (isApiError(error, "unauthorized")) redirect("/erp?expirou=1");
    throw error;
  }
}

export async function requireSession() {
  const session = await getSession();
  if (!session) redirect("/erp");
  return session;
}

export const getDashboard = () => load<erp.Dashboard>("/erp/dashboard");

export const listProducts = (query: Partial<Record<"page" | "search" | "category" | "lowStock" | "pageSize", string | number | undefined>>) =>
  load<erp.Paginated<erp.Product>>("/erp/products", query);

export const listCustomers = (query: Partial<Record<"page" | "search" | "pageSize", string | number | undefined>>) =>
  load<erp.Paginated<erp.Customer>>("/erp/customers", query);

export const listMovements = (query: Partial<Record<"page" | "productId" | "type", string | number | undefined>>) =>
  load<erp.Paginated<erp.StockMovement>>("/erp/stock/movements", query);

export const listOrders = (query: Partial<Record<"page" | "status" | "customerId", string | number | undefined>>) =>
  load<erp.Paginated<erp.Order>>("/erp/orders", query);

export async function getOrder(id: string) {
  try {
    return await erpRequest<erp.Order>(`/erp/orders/${id}`);
  } catch (error) {
    if (isApiError(error, "unauthorized")) redirect("/erp?expirou=1");
    if (isApiError(error, "not_found") || isApiError(error, "validation_error")) return null;
    throw error;
  }
}

/** Todos os produtos ativos (para seletores): até 100 — a demo tem 40. */
export const allProducts = async () => (await listProducts({ pageSize: 100 })).items;
export const allCustomers = async () => (await listCustomers({ pageSize: 100 })).items;
