"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { LocaleSwitcher } from "@godzilla/ui";
import { LOCALE_COOKIE, type Locale } from "@/i18n/config";

/**
 * Bandeiras dos sistemas embutidos. Sem locale na URL: grava a escolha no
 * mesmo cookie do portfólio e re-renderiza a página no servidor.
 */
export function SystemLocaleSwitcher({ locale }: { locale: Locale }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const changeLocale = (next: Locale) => {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => router.refresh());
  };

  return <LocaleSwitcher value={locale} onValueChange={changeLocale} />;
}
