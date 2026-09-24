import { NextResponse, type NextRequest } from "next/server";
import { getSpotifyConfig, isSpotifyConfigured } from "@/lib/spotify/auth";
import { SESSION_COOKIE, unsealSession } from "@/lib/spotify/session";

/**
 * SÓ EM DESENVOLVIMENTO: mostra o refresh token da sessão atual para o dono
 * configurar o modo vitrine (SPOTIFY_OWNER_REFRESH_TOKEN). Em produção a rota
 * responde 404 — o token nunca sai do cookie cifrado lá.
 */
export function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") return new NextResponse(null, { status: 404 });
  if (!isSpotifyConfigured()) return new NextResponse("Configure SPOTIFY_* no .env.local primeiro.", { status: 400 });

  const session = unsealSession(request.cookies.get(SESSION_COOKIE)?.value, getSpotifyConfig().clientSecret);
  if (!session?.refreshToken) {
    return new NextResponse("Faça login em /spotify (Connect Spotify) com a sua conta e volte aqui.", { status: 401 });
  }

  return new NextResponse(
    [
      "Refresh token da conta logada — use como SPOTIFY_OWNER_REFRESH_TOKEN (Vercel, tipo Secret).",
      "Validade: 6 meses. Não compartilhe.",
      "",
      session.refreshToken,
    ].join("\n"),
    { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" } },
  );
}
