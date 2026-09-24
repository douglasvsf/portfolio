import { decrypt, encrypt } from "./crypto";
import type { TokenResponse } from "./types";

/**
 * Sessão sem banco de dados: os tokens vivem num único cookie httpOnly,
 * cifrado (ver crypto.ts). O cookie de "oauth" guarda state + code_verifier
 * só durante o vai-e-volta da autorização.
 */

export const SESSION_COOKIE = "gss_session";
export const OAUTH_COOKIE = "gss_oauth";
export const DEMO_COOKIE = "gss_demo";
/** Usuário do Last.fm escolhido pelo visitante (dado público, sem segredo). */
export const LASTFM_COOKIE = "gss_lastfm";
/** Valor do cookie de demo que ignora a vitrine e usa sempre os dados mockados. */
export const DEMO_MOCK_VALUE = "mock";

/** Renova o access token quando faltar menos que isso para expirar. */
const REFRESH_MARGIN_MS = 60_000;
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;
const OAUTH_MAX_AGE = 60 * 10;

export interface Session {
  accessToken: string;
  refreshToken: string;
  /** Epoch em ms. */
  expiresAt: number;
}

export interface OAuthState {
  state: string;
  codeVerifier: string;
}

interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
}

function baseCookie(maxAge: number): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  };
}

export const sessionCookieOptions = baseCookie(SESSION_MAX_AGE);
export const oauthCookieOptions = baseCookie(OAUTH_MAX_AGE);
/** O modo demo não guarda nada sensível — só um marcador. */
export const demoCookieOptions: CookieOptions = { ...baseCookie(60 * 60 * 24), httpOnly: false };

export function sessionFromToken(token: TokenResponse, previous?: Session, now = Date.now()): Session {
  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token ?? previous?.refreshToken ?? "",
    expiresAt: now + token.expires_in * 1000,
  };
}

export function isExpiring(session: Session, now = Date.now()) {
  return session.expiresAt - now < REFRESH_MARGIN_MS;
}

export function isValidSession(value: unknown): value is Session {
  if (!value || typeof value !== "object") return false;
  const session = value as Record<string, unknown>;
  return (
    typeof session.accessToken === "string" &&
    session.accessToken.length > 0 &&
    typeof session.refreshToken === "string" &&
    typeof session.expiresAt === "number"
  );
}

export function sealSession(session: Session, secret: string) {
  return encrypt(session, secret);
}

export function unsealSession(value: string | undefined, secret: string): Session | null {
  const session = decrypt<unknown>(value, secret);
  return isValidSession(session) ? session : null;
}
