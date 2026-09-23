import type { Locale } from "@/i18n/config";
import type { SiteContent } from "./types";
import { ptBR } from "./pt-BR";
import { enUS } from "./en-US";
import { esES } from "./es-ES";

export type { SiteContent } from "./types";
export { SECTION_IDS } from "./shared";

const content: Record<Locale, SiteContent> = {
  "pt-BR": ptBR,
  "en-US": enUS,
  "es-ES": esES,
};

export function getContent(locale: Locale): SiteContent {
  return content[locale];
}
