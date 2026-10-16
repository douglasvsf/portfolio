"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { agent } from "@portfolio/shared";
import { erpRequest, isApiError } from "@/lib/erp/client";
import { clearAgentSession, getAgentSession, saveAgentSession } from "./session";

/**
 * Server actions do Kaiju Agent (BFF). A tela só manda texto e cliques de
 * confirmar; quem fala com a API — e guarda o token — é o servidor do site.
 */
export type AgentActionState = { status: "idle" } | { status: "error"; message: string; draft?: string };

const IDLE: AgentActionState = { status: "idle" };
const UNAVAILABLE = "Não consegui falar com o agente agora. Tente de novo em instantes.";

function fail(error: unknown, draft?: string): AgentActionState {
  if (isApiError(error, "rate_limited")) return { status: "error", message: error.message || "Muitas mensagens. Aguarde um pouco.", draft };
  if (isApiError(error) && error.status < 500) return { status: "error", message: error.message, draft };
  if (isApiError(error, "service_unavailable")) return { status: "error", message: error.message, draft };
  return { status: "error", message: UNAVAILABLE, draft };
}

/** Fora de qualquer try: o redirect do Next é uma exceção e não pode ser engolido pelo catch. */
async function token() {
  const session = await getAgentSession();
  if (!session) redirect("/agente?expirou=1");
  return session.token;
}

/** Conversa recusada pela API (venceu): limpa o cookie e volta para a entrada. */
async function expired(error: unknown) {
  if (isApiError(error, "unauthorized")) {
    await clearAgentSession();
    redirect("/agente?expirou=1");
  }
}

export async function startConversation(): Promise<AgentActionState> {
  let session: agent.AgentSession;
  try {
    session = await erpRequest<agent.AgentSession>("/agent/sessions", { method: "POST", anonymous: true });
  } catch (error) {
    if (isApiError(error, "rate_limited")) return { status: "error", message: "Você já começou várias conversas na última hora. Tente de novo mais tarde." };
    if (isApiError(error, "demo_full")) return { status: "error", message: "Muitas demonstrações ativas agora. Tente de novo mais tarde." };
    return fail(error);
  }
  await saveAgentSession(session);
  redirect("/agente");
}

export async function endConversation(): Promise<void> {
  await clearAgentSession();
  redirect("/agente");
}

export async function sendMessage(_: AgentActionState, form: FormData): Promise<AgentActionState> {
  const raw = form.get("message");
  const parsed = agent.agentMessageSchema.safeParse({ message: typeof raw === "string" ? raw : "" });
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Mensagem inválida.", draft: typeof raw === "string" ? raw : "" };
  const auth = await token();
  try {
    await erpRequest<agent.AgentTurn>("/agent/messages", { method: "POST", body: parsed.data, token: auth });
  } catch (error) {
    await expired(error);
    return fail(error, parsed.data.message);
  }
  revalidatePath("/agente");
  return IDLE;
}

export async function confirmAction(turnId: string, approve: boolean): Promise<AgentActionState> {
  const auth = await token();
  try {
    await erpRequest<agent.AgentTurn>(`/agent/turns/${encodeURIComponent(turnId)}/confirm`, { method: "POST", body: { approve }, token: auth });
  } catch (error) {
    await expired(error);
    return fail(error);
  }
  revalidatePath("/agente");
  return IDLE;
}
