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

export const friendlyMessages: Record<SpotifyErrorKind, { title: string; description: string }> = {
  unauthorized: {
    title: "Your session expired",
    description: "Connect your Spotify account again to keep exploring your stats.",
  },
  forbidden: {
    title: "Spotify denied access",
    description:
      "This app runs in Spotify's Development Mode, so only allow-listed accounts can connect. Try the demo instead.",
  },
  rate_limited: {
    title: "Too many requests",
    description: "Spotify is limiting requests right now. Wait a few seconds and try again.",
  },
  unavailable: {
    title: "Spotify is unavailable",
    description: "The Spotify API is not responding at the moment. Please try again shortly.",
  },
  timeout: {
    title: "Spotify took too long",
    description: "The request timed out. Check your connection and try again.",
  },
  network: {
    title: "Connection problem",
    description: "We couldn't reach Spotify. Check your connection and try again.",
  },
  not_found: {
    title: "User not found",
    description: "We couldn't find that Last.fm user. Check the username and try again.",
  },
  unknown: {
    title: "Something went wrong",
    description: "An unexpected error happened while loading your stats. Please try again.",
  },
};

export function toErrorKind(error: unknown): SpotifyErrorKind {
  return error instanceof SpotifyApiError ? error.kind : "unknown";
}
