import { SpotifyApiError, type SpotifyErrorKind } from "@/lib/spotify/errors";
import type { LastfmErrorResponse } from "./types";

/**
 * Único ponto de HTTP para a API do Last.fm. Os erros viram o mesmo
 * `SpotifyApiError` da integração Spotify, para a UI tratar tudo igual.
 */

const API_BASE = "https://ws.audioscrobbler.com/2.0/";
const TIMEOUT_MS = 8000;

export function isLastfmConfigured(env: NodeJS.ProcessEnv = process.env) {
  return Boolean(env.LASTFM_API_KEY);
}

/** Códigos de erro do Last.fm → tipos de erro do app. */
export function kindFromLastfmError(code: number): SpotifyErrorKind {
  if (code === 6) return "not_found"; // "User not found" / parâmetro inválido
  if (code === 17) return "forbidden"; // perfil privado
  if (code === 29) return "rate_limited";
  if (code === 8 || code === 11 || code === 16) return "unavailable";
  return "unknown";
}

export function buildLastfmUrl(method: string, params: Record<string, string | number | undefined>, apiKey: string) {
  const url = new URL(API_BASE);
  url.searchParams.set("method", method);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("format", "json");
  return url.toString();
}

export async function lastfmFetch<T>(
  method: string,
  params: Record<string, string | number | undefined>,
  { revalidate = 0 }: { revalidate?: number } = {},
): Promise<T> {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) throw new SpotifyApiError("unknown", "LASTFM_API_KEY não configurada");

  let response: Response;
  try {
    response = await fetch(buildLastfmUrl(method, params, apiKey), {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      ...(revalidate > 0 ? { next: { revalidate } } : { cache: "no-store" as const }),
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    throw new SpotifyApiError(timedOut ? "timeout" : "network", `Falha de rede em ${method}`);
  }

  const body = (await response.json().catch(() => null)) as (T & Partial<LastfmErrorResponse>) | null;
  if (body && typeof body.error === "number") {
    throw new SpotifyApiError(kindFromLastfmError(body.error), `Last.fm ${method}: ${body.message}`, response.status);
  }
  if (!response.ok || !body) {
    throw new SpotifyApiError(response.status >= 500 ? "unavailable" : "unknown", `Last.fm respondeu ${response.status}`, response.status);
  }
  return body;
}
