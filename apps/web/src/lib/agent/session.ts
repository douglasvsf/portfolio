import "server-only";
import { cookies } from "next/headers";
import type { agent } from "@portfolio/shared";

/**
 * Sessão do Kaiju Agent no site (BFF): o token da conversa fica num cookie
 * httpOnly restrito a /agente. O navegador nunca fala com a API nem vê o token.
 */

const AGENT_COOKIE = "agent_session";
const COOKIE_PATH = "/agente";

export interface AgentCookie {
  token: string;
  expiresAt: string;
}

export function decodeAgentSession(value: string | undefined): AgentCookie | null {
  if (!value) return null;
  try {
    const session = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as AgentCookie;
    if (typeof session.token !== "string" || !session.token) return null;
    if (!(new Date(session.expiresAt).getTime() > Date.now())) return null;
    return session;
  } catch {
    return null;
  }
}

export async function getAgentSession(): Promise<AgentCookie | null> {
  return decodeAgentSession((await cookies()).get(AGENT_COOKIE)?.value);
}

export async function saveAgentSession(session: agent.AgentSession) {
  const stored: AgentCookie = { token: session.token, expiresAt: session.expiresAt };
  (await cookies()).set(AGENT_COOKIE, Buffer.from(JSON.stringify(stored)).toString("base64url"), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: COOKIE_PATH,
    maxAge: Math.max(1, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000)),
  });
}

export async function clearAgentSession() {
  (await cookies()).delete({ name: AGENT_COOKIE, path: COOKIE_PATH });
}
