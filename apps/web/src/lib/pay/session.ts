import "server-only";
import { cookies } from "next/headers";
import type { pay } from "@portfolio/shared";

/**
 * Sessão do GODZILLA Pay no site (BFF): a chave de API da loja de teste fica
 * num cookie httpOnly restrito a /pay — o JavaScript do navegador nunca a vê;
 * as telas falam com a API pelo servidor do site, com a chave no Authorization.
 */

const PAY_COOKIE = "pay_session";
const COOKIE_PATH = "/pay";

export interface PaySession {
  apiKey: string;
  merchantId: string;
  name: string;
  expiresAt: string;
}

export function decodePaySession(value: string | undefined): PaySession | null {
  if (!value) return null;
  try {
    const session = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as PaySession;
    if (typeof session.apiKey !== "string" || !/^gz_test_[A-Za-z0-9_-]{32}$/.test(session.apiKey) || typeof session.name !== "string") return null;
    if (!(new Date(session.expiresAt).getTime() > Date.now())) return null;
    return session;
  } catch {
    return null;
  }
}

export async function getPaySession(): Promise<PaySession | null> {
  return decodePaySession((await cookies()).get(PAY_COOKIE)?.value);
}

export async function savePaySession(sandbox: pay.Sandbox) {
  const stored: PaySession = { apiKey: sandbox.apiKey, merchantId: sandbox.id, name: sandbox.name, expiresAt: sandbox.expiresAt };
  (await cookies()).set(PAY_COOKIE, Buffer.from(JSON.stringify(stored)).toString("base64url"), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: COOKIE_PATH,
    maxAge: Math.max(1, Math.floor((new Date(sandbox.expiresAt).getTime() - Date.now()) / 1000)),
  });
}

export async function clearPaySession() {
  (await cookies()).delete({ name: PAY_COOKIE, path: COOKIE_PATH });
}
