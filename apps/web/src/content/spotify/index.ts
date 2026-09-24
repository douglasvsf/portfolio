import { useLocale } from "@godzilla/ui";
import type { Locale } from "@/i18n/config";
import { enUS } from "./en-US";
import { esES } from "./es-ES";
import { ptBR } from "./pt-BR";
import type { SpotifyDictionary } from "./types";

export type { Plural, SpotifyDictionary } from "./types";

const dictionaries: Record<Locale, SpotifyDictionary> = { "pt-BR": ptBR, "en-US": enUS, "es-ES": esES };

export function getSpotifyDictionary(locale: Locale): SpotifyDictionary {
  return dictionaries[locale];
}

/** Para Client Components — o idioma vem do I18nProvider do layout. */
export function useSpotifyDictionary(): { dict: SpotifyDictionary; locale: Locale } {
  const locale = useLocale() as Locale;
  return { dict: dictionaries[locale], locale };
}
