import { useLocale } from "@godzilla/ui";
import type { Locale } from "@/i18n/config";
import { enUS } from "./en-US";
import { esES } from "./es-ES";
import { ptBR } from "./pt-BR";
import type { StocksDictionary } from "./types";

export type { StocksDictionary };

const dictionaries: Record<Locale, StocksDictionary> = { "pt-BR": ptBR, "en-US": enUS, "es-ES": esES };

export function getStocksDictionary(locale: Locale): StocksDictionary {
  return dictionaries[locale];
}

/** Para Client Components — o idioma vem do I18nProvider do layout. */
export function useStocksDictionary(): StocksDictionary {
  return dictionaries[useLocale() as Locale];
}
