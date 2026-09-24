/**
 * Erros da integração com a Spotify, já classificados para a UI escolher uma
 * mensagem amigável — o detalhe técnico nunca chega ao usuário.
 */
export type SpotifyErrorKind =
  | "unauthorized" // token inválido/expirado e sem refresh possível
  | "forbidden" // scope faltando ou usuário fora da allowlist do app
  | "rate_limited"
  | "unavailable" // 5xx da Spotify
  | "timeout"
  | "network"
  | "not_found" // usuário do Last.fm inexistente
  | "unknown";

export class SpotifyApiError extends Error {
  constructor(
    readonly kind: SpotifyErrorKind,
    message: string,
    readonly status?: number,
    /** Segundos sugeridos pela Spotify (header Retry-After) em caso de 429. */
    readonly retryAfter?: number,
  ) {
    super(message);
    this.name = "SpotifyApiError";
  }
}

export function kindFromStatus(status: number): SpotifyErrorKind {
  if (status === 401) return "unauthorized";
  if (status === 403) return "forbidden";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "unavailable";
  return "unknown";
}


export function toErrorKind(error: unknown): SpotifyErrorKind {
  return error instanceof SpotifyApiError ? error.kind : "unknown";
}
