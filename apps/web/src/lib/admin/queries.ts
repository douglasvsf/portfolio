import "server-only";
import type { agent, contact } from "@portfolio/shared";
import { erpRequest, isApiError } from "@/lib/erp/client";
import { getAdminSession, type AdminSession } from "./session";

/**
 * Dados do painel do site. Sem sessão — ou com sessão que a API não aceita
 * mais (vencida, senha trocada, conta bloqueada) — devolve `null` e a página
 * mostra o login.
 */
export async function adminPanel(): Promise<{ session: AdminSession; messages: contact.ContactMessage[] } | null> {
  const session = await getAdminSession();
  if (!session) return null;
  try {
    return { session, messages: await erpRequest<contact.ContactMessage[]>("/admin/messages", { token: session.token }) };
  } catch (error) {
    if (isApiError(error, "unauthorized") || isApiError(error, "forbidden")) return null;
    throw error;
  }
}

/** O cadastro do login do painel só existe enquanto não houver nenhum. Na dúvida (API fora do ar), não oferece. */
export async function adminSetupAvailable(): Promise<boolean> {
  try {
    return (await erpRequest<{ available: boolean }>("/admin/auth/setup", { anonymous: true })).available;
  } catch {
    return false;
  }
}

export type AgentAuditTurn = agent.AgentTurn & { session: string; llmCalls: number };

/** Auditoria do Kaiju Agent. Se a API ainda não tiver o agente (ou falhar), o painel segue sem a seção. */
export async function agentAudit(token: string): Promise<AgentAuditTurn[] | null> {
  try {
    return await erpRequest<AgentAuditTurn[]>("/admin/agent/turns", { token });
  } catch {
    return null;
  }
}
