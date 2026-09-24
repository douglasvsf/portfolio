import { NextResponse, type NextRequest } from "next/server";
import { getSpotifyConfig, isSpotifyConfigured, refreshAccessToken } from "./auth";
import { SpotifyApiError } from "./errors";
import { SESSION_COOKIE, isExpiring, sealSession, sessionCookieOptions, sessionFromToken, unsealSession } from "./session";

/**
 * Renova o access token antes que ele expire (dura 1h). Roda no proxy porque
 * é o único ponto antes da renderização que pode gravar cookies: o cookie
 * novo vai tanto na resposta (navegador) quanto no request (server components).
 */
export async function spotifySessionProxy(request: NextRequest) {
  const cookie = request.cookies.get(SESSION_COOKIE)?.value;
  if (!cookie || !isSpotifyConfigured()) return NextResponse.next();

  const config = getSpotifyConfig();
  const session = unsealSession(cookie, config.clientSecret);
  if (!session || !session.refreshToken) return clearSession(request);
  if (!isExpiring(session)) return NextResponse.next();

  try {
    const refreshed = sealSession(sessionFromToken(await refreshAccessToken(config, session.refreshToken), session), config.clientSecret);
    request.cookies.set(SESSION_COOKIE, refreshed);
    const response = NextResponse.next({ request });
    response.cookies.set(SESSION_COOKIE, refreshed, sessionCookieOptions);
    return response;
  } catch (error) {
    // Refresh token revogado → sessão acabou. Falha temporária (rede, 5xx) →
    // segue com o token atual e a página mostra o erro amigável.
    if (error instanceof SpotifyApiError && error.kind === "unauthorized") return clearSession(request);
    return NextResponse.next();
  }
}

function clearSession(request: NextRequest) {
  request.cookies.delete(SESSION_COOKIE);
  const response = NextResponse.next({ request });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
