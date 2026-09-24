import { SPOTIFY_SCOPES } from "@/config/spotify";
import { SpotifyApiError, kindFromStatus } from "./errors";
import type { TokenResponse } from "./types";

/**
 * OAuth da Spotify — Authorization Code com PKCE, executado inteiramente no
 * servidor (route handlers). O client secret também é enviado na troca do
 * code: o app é um "confidential client", e o PKCE soma proteção contra
 * interceptação do code.
 */

const AUTHORIZE_URL = "https://accounts.spotify.com/authorize";
const TOKEN_URL = "https://accounts.spotify.com/api/token";
const TIMEOUT_MS = 8000;

export interface SpotifyConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

export class SpotifyConfigError extends Error {
  constructor(missing: string[]) {
    super(`Variáveis de ambiente ausentes: ${missing.join(", ")}`);
    this.name = "SpotifyConfigError";
  }
}

export function getSpotifyConfig(env: NodeJS.ProcessEnv = process.env): SpotifyConfig {
  const config = {
    clientId: env.SPOTIFY_CLIENT_ID ?? "",
    clientSecret: env.SPOTIFY_CLIENT_SECRET ?? "",
    redirectUri: env.SPOTIFY_REDIRECT_URI ?? "",
  };
  const missing = Object.entries({
    SPOTIFY_CLIENT_ID: config.clientId,
    SPOTIFY_CLIENT_SECRET: config.clientSecret,
    SPOTIFY_REDIRECT_URI: config.redirectUri,
  })
    .filter(([, value]) => !value)
    .map(([key]) => key);
  if (missing.length) throw new SpotifyConfigError(missing);
  return config;
}

export function isSpotifyConfigured(env: NodeJS.ProcessEnv = process.env) {
  return Boolean(env.SPOTIFY_CLIENT_ID && env.SPOTIFY_CLIENT_SECRET && env.SPOTIFY_REDIRECT_URI);
}

export function buildAuthorizeUrl(config: SpotifyConfig, { state, codeChallenge }: { state: string; codeChallenge: string }) {
  const url = new URL(AUTHORIZE_URL);
  url.search = new URLSearchParams({
    client_id: config.clientId,
    response_type: "code",
    redirect_uri: config.redirectUri,
    scope: SPOTIFY_SCOPES.join(" "),
    state,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
  }).toString();
  return url.toString();
}

async function requestToken(config: SpotifyConfig, body: Record<string, string>): Promise<TokenResponse> {
  let response: Response;
  try {
    response = await fetch(TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,
      },
      body: new URLSearchParams({ client_id: config.clientId, ...body }),
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    throw new SpotifyApiError(timedOut ? "timeout" : "network", "Falha ao falar com accounts.spotify.com");
  }

  if (!response.ok) {
    // 400 invalid_grant = code/refresh token inválido ou revogado → nova autenticação.
    const kind = response.status === 400 ? "unauthorized" : kindFromStatus(response.status);
    throw new SpotifyApiError(kind, `Token endpoint respondeu ${response.status}`, response.status);
  }
  return (await response.json()) as TokenResponse;
}

export function exchangeCodeForToken(config: SpotifyConfig, code: string, codeVerifier: string) {
  return requestToken(config, {
    grant_type: "authorization_code",
    code,
    redirect_uri: config.redirectUri,
    code_verifier: codeVerifier,
  });
}

export function refreshAccessToken(config: SpotifyConfig, refreshToken: string) {
  return requestToken(config, { grant_type: "refresh_token", refresh_token: refreshToken });
}
