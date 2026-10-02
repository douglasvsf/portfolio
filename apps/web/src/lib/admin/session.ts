import "server-only";
import { cookies } from "next/headers";
import type { admin } from "@portfolio/shared";

/**
 * Sessão do painel administrativo do portfólio (/admin). O painel tem login
 * próprio, separado das contas do ERP, e cookie próprio, restrito a /admin.
 * O token fica num cookie httpOnly; quem decide permissão é a API.
 */

const ADMIN_COOKIE = "admin_session";
const COOKIE_PATH = "/admin";

export interface AdminSession {
  token: string;
  name: string;
  email: string;
  expiresAt: string;
}

export function decodeAdminSession(value: string | undefined): AdminSession | null {
  if (!value) return null;
  try {
    const session = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as AdminSession;
    if (typeof session.token !== "string" || !session.token || typeof session.name !== "string") return null;
    if (!(new Date(session.expiresAt).getTime() > Date.now())) return null;
    return session;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminSession | null> {
  return decodeAdminSession((await cookies()).get(ADMIN_COOKIE)?.value);
}

export async function saveAdminSession(session: admin.AdminSession) {
  const stored: AdminSession = { token: session.token, name: session.name, email: session.email, expiresAt: session.expiresAt };
  (await cookies()).set(ADMIN_COOKIE, Buffer.from(JSON.stringify(stored)).toString("base64url"), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: COOKIE_PATH,
    maxAge: Math.max(1, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / 1000)),
  });
}

export async function clearAdminSession() {
  (await cookies()).delete({ name: ADMIN_COOKIE, path: COOKIE_PATH });
}
