import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { erp } from "@portfolio/shared";
import { erpRequest, isApiError } from "./client";
import { getSession, type ErpSession } from "./session";

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

/**
 * Sessão da requisição. Na conta de verdade, o papel vem da API a cada página
 * (/erp/me): se um administrador trocar o papel ou bloquear a pessoa, a tela
 * acompanha na hora. `cache` evita repetir a chamada entre layout e página.
 */
export const currentSession = cache(async (): Promise<ErpSession | null> => {
  const session = await getSession();
  if (!session || session.kind !== "account") return session;
  try {
    const me = await erpRequest<erp.Me>("/erp/me");
    return { ...session, role: me.role };
  } catch (error) {
    // Bloqueada, senha trocada ou token vencido: sem sessão (o layout não pode redirecionar em loop).
    if (isApiError(error, "unauthorized")) return null;
    throw error;
  }
});

export async function requireSession() {
  const session = await currentSession();
  if (!session) redirect((await getSession()) ? "/erp?expirou=1" : "/erp");
  return session;
}

/** Páginas só de conta (equipe, minha conta); `admin` e `owner` restringem mais. */
export async function requireAccount(level?: "admin" | "owner") {
  const session = await requireSession();
  if (session.kind !== "account") redirect("/erp/dashboard");
  if (level === "admin" && session.role !== "admin") redirect("/erp/dashboard");
  if (level === "owner" && !session.user?.isOwner) redirect("/erp/dashboard");
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

// ---- Contas -----------------------------------------------------------------------

export const getTeam = () => load<erp.Team>("/erp/team");
export const ownerOverview = () => load<erp.OwnerOverview>("/erp/owner/overview");
export const ownerCompanies = () => load<erp.Company[]>("/erp/owner/companies");
export const ownerUsers = () => load<erp.TeamMember[]>("/erp/owner/users");
export const ownerInvites = () => load<erp.Invite[]>("/erp/owner/invites");

/** A instalação (criar o dono) só aparece enquanto não houver dono. */
export async function setupAvailable() {
  try {
    return (await erpRequest<{ available: boolean }>("/erp/auth/setup", { anonymous: true })).available;
  } catch {
    return false;
  }
}

/** Convite ou link de senha: `null` se inválido, usado ou vencido. */
async function preview<T>(path: string): Promise<T | null> {
  try {
    return await erpRequest<T>(path, { anonymous: true });
  } catch (error) {
    if (isApiError(error, "not_found") || isApiError(error, "validation_error")) return null;
    throw error;
  }
}
export const previewInvite = (token: string) => preview<erp.InvitePreview>(`/erp/auth/invites/${encodeURIComponent(token)}`);
export const previewReset = (token: string) => preview<erp.ResetPreview>(`/erp/auth/resets/${encodeURIComponent(token)}`);
