"use client";

import { usePathname, useRouter } from "next/navigation";
import { LocaleSwitcher, type LocaleSwitcherProps } from "@godzilla/ui";
import { LOCALE_COOKIE, type Locale } from "@/i18n/config";

export interface LanguageSwitcherProps extends Omit<LocaleSwitcherProps, "value" | "onValueChange"> {
  locale: Locale;
}

/**
 * Liga o LocaleSwitcher (controlado, do Design System) às rotas do site:
 * troca o segmento /{locale} mantendo a seção atual (#hash) e a posição de
 * scroll, e salva a escolha no cookie lido pelo proxy.
 */
export function LanguageSwitcher({ locale, ...props }: LanguageSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();

  const changeLocale = (next: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    const rest = pathname.replace(/^\/[^/]+/, "");
    router.push(`/${next}${rest}${window.location.hash}`, { scroll: false });
  };

  return <LocaleSwitcher value={locale} onValueChange={changeLocale} {...props} />;
}
