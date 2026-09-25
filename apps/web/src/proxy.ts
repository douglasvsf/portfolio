import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, locales, resolveLocale } from "@/i18n/config";
import { SPOTIFY_BASE_PATH } from "@/config/spotify";
import { spotifySessionProxy } from "@/lib/spotify/proxy";

/**
 * Toda página do portfólio vive sob /{locale} (ex.: /pt-BR). Quem chega sem
 * locale na URL é redirecionado para o idioma salvo no cookie ou, na falta
 * dele, o do navegador.
 *
 * O GODZILLA Spotify Stats (/spotify) não tem i18n — ali o proxy só mantém a
 * sessão da Spotify renovada.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === SPOTIFY_BASE_PATH || pathname.startsWith(`${SPOTIFY_BASE_PATH}/`)) {
    return spotifySessionProxy(request);
  }

  const hasLocale = locales.some((locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`));

  if (hasLocale) return;

  const locale = resolveLocale({
    cookie: request.cookies.get(LOCALE_COOKIE)?.value,
    acceptLanguage: request.headers.get("accept-language"),
  });

  request.nextUrl.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  // Ignora internos do Next, rotas de API, o Storybook publicado em /design-system,
  // o Kaiju Stocks em /stocks (só pt-BR) e arquivos estáticos (qualquer coisa com extensão).
  // Atenção ao escape: numa string JS, "\." vira só "." — a regex ficava ".*.*" (casa com tudo)
  // e o proxy só rodava em "/"; rotas sem idioma, como /projetos/..., davam 404.
  matcher: ["/((?!_next|api|design-system|stocks|.*\\..*).*)"],
};
