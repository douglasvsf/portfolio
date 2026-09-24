import { getSpotifyConfig, isSpotifyConfigured, refreshAccessToken } from "./auth";

/**
 * Modo vitrine ("showcase"): qualquer visitante vê as estatísticas REAIS do
 * dono do portfólio, sem login. O servidor usa o refresh token do dono
 * (SPOTIFY_OWNER_REFRESH_TOKEN) — uma única conta, então o limite de 5
 * usuários do Development Mode não se aplica aos visitantes.
 *
 * O access token (1h) fica em memória na instância e é compartilhado por
 * todas as requisições; várias chamadas simultâneas reaproveitam o mesmo
 * refresh em andamento.
 */

const REFRESH_MARGIN_MS = 60_000;

let cached: { accessToken: string; expiresAt: number } | null = null;
let inflight: Promise<string> | null = null;

export function isOwnerConfigured(env: NodeJS.ProcessEnv = process.env) {
  return isSpotifyConfigured(env) && Boolean(env.SPOTIFY_OWNER_REFRESH_TOKEN);
}

export async function getOwnerAccessToken(now = Date.now()): Promise<string> {
  if (cached && cached.expiresAt - now > REFRESH_MARGIN_MS) return cached.accessToken;
  if (inflight) return inflight;

  inflight = (async () => {
    try {
      const token = await refreshAccessToken(getSpotifyConfig(), process.env.SPOTIFY_OWNER_REFRESH_TOKEN ?? "");
      cached = { accessToken: token.access_token, expiresAt: Date.now() + token.expires_in * 1000 };
      return token.access_token;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

/** Só para testes. */
export function resetOwnerTokenCache() {
  cached = null;
  inflight = null;
}
