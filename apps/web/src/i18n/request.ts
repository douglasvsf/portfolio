import "server-only";
import { cookies, headers } from "next/headers";
import { LOCALE_COOKIE, resolveLocale, type Locale } from "./config";

/**
 * Idioma da requisição nos sistemas (Stocks, Spotify Stats), que não têm o
 * locale na URL: vale a mesma escolha do portfólio (cookie das bandeiras) e,
 * na falta dela, o idioma do navegador.
 */
export async function getRequestLocale(): Promise<Locale> {
  const [store, requestHeaders] = await Promise.all([cookies(), headers()]);
  return resolveLocale({
    cookie: store.get(LOCALE_COOKIE)?.value,
    acceptLanguage: requestHeaders.get("accept-language"),
  });
}
