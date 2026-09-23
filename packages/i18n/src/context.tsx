"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Dictionary, Locale } from "./dictionary";
import { ptBR } from "./locales/pt-BR";
import { enUS } from "./locales/en-US";
import { esES } from "./locales/es-ES";

export const dictionaries: Record<Locale, Dictionary> = {
  "pt-BR": ptBR,
  "en-US": enUS,
  "es-ES": esES,
};

export const DEFAULT_LOCALE: Locale = "pt-BR";

interface I18nContextValue {
  locale: Locale;
  t: Dictionary;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export interface I18nProviderProps {
  /** Locale ativo. Se omitido, usa `pt-BR`. */
  locale?: Locale;
  children: ReactNode;
}

/**
 * Provider de i18n do Design System. Envolve a aplicação (ou uma subárvore)
 * para que os componentes de `@godzilla/ui` resolvam suas strings internas
 * (ex.: "Fechar", "Próximo", "Nenhum resultado encontrado") no idioma certo.
 */
export function I18nProvider({ locale = DEFAULT_LOCALE, children }: I18nProviderProps) {
  const value = useMemo<I18nContextValue>(() => ({ locale, t: dictionaries[locale] }), [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Dicionário de strings do locale ativo. Fora de um `I18nProvider`, resolve
 * para o locale padrão em vez de lançar — os componentes precisam funcionar
 * mesmo em apps que ainda não configuraram i18n explicitamente.
 */
export function useTranslation(): Dictionary {
  const ctx = useContext(I18nContext);
  return ctx?.t ?? dictionaries[DEFAULT_LOCALE];
}

export function useLocale(): Locale {
  const ctx = useContext(I18nContext);
  return ctx?.locale ?? DEFAULT_LOCALE;
}
