import { SpotifyApiError, kindFromStatus } from "./errors";

/**
 * Único ponto do app que faz HTTP para api.spotify.com: monta URL e headers,
 * aplica timeout e cache, e converte qualquer falha em SpotifyApiError.
 */

const API_BASE = "https://api.spotify.com/v1";
const TIMEOUT_MS = 8000;

export interface SpotifyRequestOptions {
  params?: Record<string, string | number | undefined>;
  /**
   * Segundos de cache no Data Cache do Next. A chave inclui o header
   * Authorization, então cada token (usuário) tem seu próprio cache.
   * `0` = sempre buscar (ex.: currently playing).
   */
  revalidate?: number;
}

export function buildUrl(path: string, params: SpotifyRequestOptions["params"] = {}) {
  const url = new URL(`${API_BASE}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/** Retorna `null` para 204 No Content (ex.: nada tocando agora). */
export async function spotifyFetch<T>(path: string, accessToken: string, options: SpotifyRequestOptions = {}): Promise<T | null> {
  const { params, revalidate = 0 } = options;

  let response: Response;
  try {
    response = await fetch(buildUrl(path, params), {
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
  return text ? (JSON.parse(text) as T) : null;
}
