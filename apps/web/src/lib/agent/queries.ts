import "server-only";
import type { agent } from "@portfolio/shared";
import { erpRequest, isApiError } from "@/lib/erp/client";
import { getAgentSession } from "./session";

/** A conversa atual, ou `null` sem conversa (ou com ela vencida: a tela mostra a entrada de novo). */
export async function getConversation(): Promise<agent.AgentConversation | null> {
  const session = await getAgentSession();
  if (!session) return null;
  try {
    return await erpRequest<agent.AgentConversation>("/agent/conversation", { token: session.token });
  } catch (error) {
    if (isApiError(error, "unauthorized")) return null;
    throw error;
  }
}
