import { NextResponse, type NextRequest } from "next/server";
import { routes } from "@/config/spotify";
import { isLastfmConfigured } from "@/lib/lastfm/client";
import { getUserInfo } from "@/lib/lastfm/endpoints";
import { SpotifyApiError } from "@/lib/spotify/errors";
import { requestOrigin } from "@/lib/spotify/request-origin";
import { DEMO_COOKIE, LASTFM_COOKIE, demoCookieOptions } from "@/lib/spotify/session";
import { isValidLastfmUsername } from "@/lib/spotify/source";

/**
 * Entra no dashboard com um usuário do Last.fm: /api/spotify/lastfm?username=xxx.
 * Valida que o usuário existe antes de gravar o cookie. Também serve como
 * link compartilhável ("veja as estatísticas de fulano").
 */
export async function GET(request: NextRequest) {
  const origin = requestOrigin(request);
  const fail = (reason: string) => NextResponse.redirect(new URL(`${routes.landing}?error=${reason}#lastfm`, origin));

  if (!isLastfmConfigured()) return fail("lastfm_not_configured");

  const username = request.nextUrl.searchParams.get("username")?.trim();
  if (!isValidLastfmUsername(username)) return fail("lastfm_not_found");

  let canonical: string;
  try {
    canonical = (await getUserInfo(username)).id; // nome com a caixa correta
  } catch (error) {
    const kind = error instanceof SpotifyApiError ? error.kind : "unknown";
    return fail(kind === "not_found" ? "lastfm_not_found" : kind === "forbidden" ? "lastfm_private" : "lastfm_unavailable");
  }

  const response = NextResponse.redirect(new URL(routes.dashboard, origin));
  // Nome de usuário é público — cookie comum (não httpOnly), mesma validade do demo.
  response.cookies.set(LASTFM_COOKIE, canonical, demoCookieOptions);
  response.cookies.delete(DEMO_COOKIE);
  return response;
}
