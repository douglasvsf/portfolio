import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE, locales, resolveLocale } from "@/i18n/config";

/**
 * Toda página vive sob /{locale} (ex.: /pt-BR). Quem chega sem locale na URL
 * é redirecionado para o idioma salvo no cookie ou, na falta dele, o do
 * navegador.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
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
  // Ignora internos do Next, rotas de API e arquivos estáticos (qualquer coisa com extensão).
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
