import { isLocale, locales, type Locale } from "@godzilla/i18n/config";

export { isLocale, locales, type Locale };

export const DEFAULT_LOCALE: Locale = "pt-BR";

/** Cookie que guarda a escolha explícita do visitante (feita pelas bandeiras). */
export const LOCALE_COOKIE = "NEXT_LOCALE";

interface ResolveLocaleInput {
  cookie?: string;
  acceptLanguage?: string | null;
}

/**
 * Decide o idioma de quem chega sem locale na URL: a escolha salva no cookie
 * vence; depois o `Accept-Language` do navegador, casando primeiro a tag
 * exata (es-ES) e depois só o idioma (es-MX → es-ES, pt-PT → pt-BR).
 */
export function resolveLocale({ cookie, acceptLanguage }: ResolveLocaleInput): Locale {
  if (cookie && isLocale(cookie)) return cookie;

  const preferred = (acceptLanguage ?? "")
    .split(",")
    .map((part) => {
      const [tag = "", ...params] = part.trim().split(";");
      const q = params.find((param) => param.trim().startsWith("q="));
      return { tag: tag.toLowerCase(), q: q ? Number(q.trim().slice(2)) : 1 };
    })
    .filter(({ tag, q }) => tag && tag !== "*" && q > 0)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of preferred) {
    const exact = locales.find((locale) => locale.toLowerCase() === tag);
    if (exact) return exact;

    const language = tag.split("-")[0];
    const sameLanguage = locales.find((locale) => locale.toLowerCase().split("-")[0] === language);
    if (sameLanguage) return sameLanguage;
  }

  return DEFAULT_LOCALE;
}
