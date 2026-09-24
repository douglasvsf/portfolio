import { NextResponse, type NextRequest } from "next/server";
import { routes } from "@/config/spotify";
import { buildAuthorizeUrl, getSpotifyConfig, isSpotifyConfigured } from "@/lib/spotify/auth";
import { codeChallengeFor, encrypt, generateCodeVerifier, randomToken } from "@/lib/spotify/crypto";
import { requestOrigin } from "@/lib/spotify/request-origin";
import { OAUTH_COOKIE, oauthCookieOptions, type OAuthState } from "@/lib/spotify/session";

/** Inicia o OAuth: gera state + PKCE, guarda num cookie cifrado e redireciona para a Spotify. */
export function GET(request: NextRequest) {
  if (!isSpotifyConfigured()) {
    return NextResponse.redirect(new URL(`${routes.landing}?error=not_configured`, requestOrigin(request)));
  }
  const config = getSpotifyConfig();

  // Os cookies precisam nascer no mesmo host do callback. A Spotify não aceita
  // "localhost" como redirect URI (só 127.0.0.1), então quem abriu o site por
  // outro host é mandado para o host do callback antes de começar.
  const callbackOrigin = new URL(config.redirectUri).origin;
  if (requestOrigin(request) !== callbackOrigin) {
    return NextResponse.redirect(new URL(routes.login, callbackOrigin));
  }

  const oauth: OAuthState = { state: randomToken(), codeVerifier: generateCodeVerifier() };
  const response = NextResponse.redirect(
    buildAuthorizeUrl(config, { state: oauth.state, codeChallenge: codeChallengeFor(oauth.codeVerifier) }),
  );
  response.cookies.set(OAUTH_COOKIE, encrypt(oauth, config.clientSecret), oauthCookieOptions);
  return response;
}
