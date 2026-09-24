import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { routes } from "@/config/spotify";
import { requestOrigin } from "@/lib/spotify/request-origin";
import { exchangeCodeForToken, getSpotifyConfig, isSpotifyConfigured } from "@/lib/spotify/auth";
import { decrypt } from "@/lib/spotify/crypto";
import { getCurrentUser } from "@/lib/spotify/endpoints";
import { SpotifyApiError } from "@/lib/spotify/errors";
import {
  DEMO_COOKIE,
  LASTFM_COOKIE,
  OAUTH_COOKIE,
  SESSION_COOKIE,
  sealSession,
  sessionCookieOptions,
  sessionFromToken,
  type OAuthState,
} from "@/lib/spotify/session";

function sameString(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Retorno do OAuth: valida o state, troca o code por tokens, valida o token e cria a sessão. */
export async function GET(request: NextRequest) {
  const fail = (reason: string) => {
    const response = NextResponse.redirect(new URL(`${routes.landing}?error=${reason}`, requestOrigin(request)));
    response.cookies.delete(OAUTH_COOKIE);
    return response;
  };

  if (!isSpotifyConfigured()) return fail("not_configured");
  const config = getSpotifyConfig();

  const params = request.nextUrl.searchParams;
  if (params.get("error")) return fail(params.get("error") === "access_denied" ? "access_denied" : "auth_failed");

  const code = params.get("code");
  const state = params.get("state");
  const oauth = decrypt<OAuthState>(request.cookies.get(OAUTH_COOKIE)?.value, config.clientSecret);
  if (!code || !state || !oauth || !sameString(state, oauth.state)) return fail("state_mismatch");

  try {
    const session = sessionFromToken(await exchangeCodeForToken(config, code, oauth.codeVerifier));
    // Valida o token recém-emitido (e se a conta está liberada no app) antes de criar a sessão.
    await getCurrentUser(session.accessToken);

    const response = NextResponse.redirect(new URL(routes.dashboard, requestOrigin(request)));
    response.cookies.set(SESSION_COOKIE, sealSession(session, config.clientSecret), sessionCookieOptions);
    response.cookies.delete(OAUTH_COOKIE);
    response.cookies.delete(DEMO_COOKIE);
    response.cookies.delete(LASTFM_COOKIE);
    return response;
  } catch (error) {
    return fail(error instanceof SpotifyApiError && error.kind === "forbidden" ? "not_allowlisted" : "auth_failed");
  }
}
