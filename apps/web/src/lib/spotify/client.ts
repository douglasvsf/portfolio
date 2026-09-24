import type { z } from "zod";
import { ContractError, parseContract } from "@/lib/http/contract";
import { withRetry, type RetryDecision } from "@/lib/http/retry";
import { SpotifyApiError, kindFromStatus } from "./errors";

/**
 * Único ponto do app que faz HTTP para api.spotify.com: monta URL e headers,
 * aplica timeout, cache e retry, valida o contrato da resposta e converte
 * qualquer falha em SpotifyApiError.
 */

const API_BASE = "https://api.spotify.com/v1";
const TIMEOUT_MS = 8000;

export interface SpotifyRequestOptions<Schema extends z.ZodType> {
  /** Contrato da resposta — nada chega à UI sem passar por ele. */
  schema: Schema;
  params?: Record<string, string | number | undefined>;
  /**
   * Segundos de cache no Data Cache do Next. A chave inclui o header
   * Authorization, então cada token (usuário) tem seu próprio cache.
   * `0` = sempre buscar (ex.: currently playing).
   */
  revalidate?: number;
}

export function buildUrl(path: string, params: Record<string, string | number | undefined> = {}) {
  const url = new URL(`${API_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/** Falhas transitórias valem nova tentativa; 429 respeita o Retry-After. */
export function retryableSpotifyError(error: unknown): RetryDecision {
  if (!(error instanceof SpotifyApiError)) return { retry: false };
  if (error.kind === "rate_limited") return error.retryAfter ? { retry: true, afterMs: error.retryAfter * 1000 } : { retry: false };
  return { retry: error.kind === "network" || error.kind === "timeout" || error.kind === "unavailable" };
}

async function requestOnce(url: string, path: string, accessToken: string, revalidate: number) {
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      ...(revalidate > 0 ? { next: { revalidate } } : { cache: "no-store" as const }),
    });
  } catch (error) {
    const timedOut = error instanceof DOMException && error.name === "TimeoutError";
    throw new SpotifyApiError(timedOut ? "timeout" : "network", `Falha de rede em ${path}`);
  }

  if (response.status === 204) return null;

  if (!response.ok) {
    const retryAfter = Number(response.headers.get("Retry-After")) || undefined;
    throw new SpotifyApiError(kindFromStatus(response.status), `Spotify respondeu ${response.status} em ${path}`, response.status, retryAfter);
  }

  // Alguns endpoints do player respondem 200 com corpo vazio em vez de 204.
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new SpotifyApiError("invalid_response", `JSON inválido em ${path}`, response.status);
  }
}

/** Retorna `null` para 204 No Content (ex.: nada tocando agora). */
export async function spotifyFetch<Schema extends z.ZodType>(
  path: string,
  accessToken: string,
  { schema, params, revalidate = 0 }: SpotifyRequestOptions<Schema>,
): Promise<z.output<Schema> | null> {
  const url = buildUrl(path, params);
  const body = await withRetry(() => requestOnce(url, path, accessToken, revalidate), { retryable: retryableSpotifyError });
  if (body === null) return null;

  try {
    return parseContract(schema, body, `spotify ${path}`);
  } catch (error) {
    if (error instanceof ContractError) throw new SpotifyApiError("invalid_response", error.message, 200);
    throw error;
  }
}
