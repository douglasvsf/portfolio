import "server-only";
import { cookies } from "next/headers";
import type { erp } from "@portfolio/shared";

/**
 * Sessão do GODZILLA ERP no site (BFF). O token fica num cookie httpOnly — o
 * JavaScript do navegador nunca o vê — restrito a /erp e com o prazo do token
 * (24h da demo ou 12h da conta). Papel, empresa e usuário vão junto só para a
 * interface: quem decide permissão é a API, pelo token.
 */

export const ERP_COOKIE = "erp_session";
const COOKIE_PATH = "/erp";

export interface ErpSession {
  /** Demonstração (empresa temporária) ou conta de verdade (login). */
  kind: "demo" | "account";
  token: string;
  role: erp.Role;
  workspace: { id: string; name: string };
  expiresAt: string;
  user?: erp.SessionUser;
}

export function encodeSession(session: ErpSession) {
  return Buffer.from(JSON.stringify(session)).toString("base64url");
}

export function decodeSession(value: string | undefined): ErpSession | null {
  if (!value) return null;
  try {
    const session = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as ErpSession;
    session.kind = session.kind === "account" && session.user ? "account" : "demo";
    if (!session.token || !session.workspace?.id || (session.role !== "admin" && session.role !== "seller")) return null;
    if (new Date(session.expiresAt).getTime() <= Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<ErpSession | null> {
  return decodeSession((await cookies()).get(ERP_COOKIE)?.value);
}

export async function saveSession(session: erp.DemoSession | erp.AccountSession) {
  const maxAge = Math.max(1, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000));
  const stored: ErpSession =
    session.kind === "account"
      ? { kind: "account", token: session.token, role: session.role, workspace: session.workspace, expiresAt: session.expiresAt, user: session.user }
      : { kind: "demo", token: session.token, role: session.role, workspace: session.workspace, expiresAt: session.expiresAt };
  (await cookies()).set(ERP_COOKIE, encodeSession(stored), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: COOKIE_PATH,
    maxAge,
  });
}

export async function clearSession() {
  (await cookies()).delete({ name: ERP_COOKIE, path: COOKIE_PATH });
}
