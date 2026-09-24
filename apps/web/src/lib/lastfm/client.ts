import type { z } from "zod";
import { ContractError, parseContract } from "@/lib/http/contract";
import { withRetry, type RetryDecision } from "@/lib/http/retry";
import { SpotifyApiError, type SpotifyErrorKind } from "@/lib/spotify/errors";
import type { LastfmErrorResponse } from "./types";

/**
 * Único ponto de HTTP para a API do Last.fm: timeout, cache, retry e
 * validação do contrato. Os erros viram o mesmo `SpotifyApiError` da
 * integração Spotify, para a UI tratar tudo igual.
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

/** Falhas transitórias (rede, timeout, 5xx e o rate limit do Last.fm, que não manda Retry-After). */
export function retryableLastfmError(error: unknown): RetryDecision {
  if (!(error instanceof SpotifyApiError)) return { retry: false };
  return { retry: ["network", "timeout", "unavailable", "rate_limited"].includes(error.kind) };
}

async function requestOnce(method: string, url: string, revalidate: number): Promise<unknown> {
  let response: Response;
  try {
    response = await fetch(url, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      ...(revalidate > 0 ? { next: { revalidate } } : { cache: "no-store" as const }),
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    throw new SpotifyApiError(timedOut ? "timeout" : "network", `Falha de rede em ${method}`);
  }

  // O Last.fm responde erros de negócio com HTTP 200 e { error, message } no corpo.
  const body = (await response.json().catch(() => null)) as (Partial<LastfmErrorResponse> & Record<string, unknown>) | null;
  if (body && typeof body.error === "number") {
    throw new SpotifyApiError(kindFromLastfmError(body.error), `Last.fm ${method}: ${body.message}`, response.status);
  }
  if (!response.ok) {
    throw new SpotifyApiError(response.status >= 500 ? "unavailable" : "unknown", `Last.fm respondeu ${response.status}`, response.status);
  }
  if (!body) throw new SpotifyApiError("invalid_response", `JSON inválido em ${method}`, response.status);
  return body;
}

export async function lastfmFetch<Schema extends z.ZodType>(
  method: string,
  params: Record<string, string | number | undefined>,
  { schema, revalidate = 0 }: { schema: Schema; revalidate?: number },
): Promise<z.output<Schema>> {
  const apiKey = process.env.LASTFM_API_KEY;
  if (!apiKey) throw new SpotifyApiError("unknown", "LASTFM_API_KEY não configurada");

  const url = buildLastfmUrl(method, params, apiKey);
  const body = await withRetry(() => requestOnce(method, url, revalidate), { retryable: retryableLastfmError });

  try {
    return parseContract(schema, body, `lastfm ${method}`);
  } catch (error) {
    if (error instanceof ContractError) throw new SpotifyApiError("invalid_response", error.message, 200);
    throw error;
  }
}
