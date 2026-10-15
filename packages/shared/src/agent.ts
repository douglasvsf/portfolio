import { z } from "zod";

/**
 * Kaiju Agent: um agente de IA que opera o GODZILLA ERP e o GODZILLA Pay de
 * um visitante em linguagem natural. Cada visitante ganha uma sessão com um
 * mercado e uma loja de teste só seus; ações que mudam dados esperam a
 * confirmação da pessoa antes de rodar.
 */

export const AGENT_LIMITS = { message: 500, turnsPerSession: 30 } as const;

export const agentMessageSchema = z.object({
  message: z.string().trim().min(1, "escreva o que você quer").max(AGENT_LIMITS.message, `no máximo ${AGENT_LIMITS.message} caracteres`),
});
export type AgentMessageInput = z.infer<typeof agentMessageSchema>;

export const agentConfirmSchema = z.object({ approve: z.boolean() });
export type AgentConfirmInput = z.infer<typeof agentConfirmSchema>;

export const AGENT_SYSTEMS = ["erp", "pay"] as const;
export type AgentSystem = (typeof AGENT_SYSTEMS)[number];

/** Um passo da linha do tempo: o que o agente chamou, com o quê, e o que voltou. */
export interface AgentToolStep {
  type: "tool";
  id: string;
  tool: string;
  system: AgentSystem;
  /** Resumo legível da chamada ("Criar cobrança Pix de R$ 50,00"). */
  label: string;
  args: unknown;
  status: "ok" | "error" | "rejected" | "awaiting_confirmation";
  result?: unknown;
  error?: string;
  durationMs?: number;
}

export interface AgentTextStep {
  type: "text";
  id: string;
  role: "user" | "assistant";
  text: string;
}

export type AgentStep = AgentToolStep | AgentTextStep;

export const AGENT_TURN_STATUSES = ["done", "awaiting_confirmation", "limit", "error"] as const;
export type AgentTurnStatus = (typeof AGENT_TURN_STATUSES)[number];

export interface AgentTurn {
  id: string;
  status: AgentTurnStatus;
  steps: AgentStep[];
  /** Ação parada esperando o "confirmar" da pessoa. */
  pending: { stepId: string; label: string } | null;
  createdAt: string;
}

export interface AgentSession {
  token: string;
  expiresAt: string;
  erp: { workspaceName: string };
  /** `null` quando o GODZILLA Pay está indisponível (banco não configurado). */
  pay: { merchantName: string } | null;
}

export interface AgentConversation {
  session: { expiresAt: string; erp: { workspaceName: string }; pay: { merchantName: string } | null; turnsLeft: number };
  turns: AgentTurn[];
}
