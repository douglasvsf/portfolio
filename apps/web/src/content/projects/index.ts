import type { Locale } from "@/i18n/config";
import { PROJECT_DATA, SNAPSHOT } from "./data";
import { enUS } from "./en-US";
import { esES } from "./es-ES";
import { ptBR } from "./pt-BR";
import type { Project, ProjectsCopy, SnapshotItem } from "./types";

export type * from "./types";
export { COMPANY_URLS } from "./data";

const copies: Record<Locale, ProjectsCopy> = { "pt-BR": ptBR, "en-US": enUS, "es-ES": esES };

/** Projetos na ordem da página, com os textos do idioma. */
export function getProjects(locale: Locale): Project[] {
  const copy = copies[locale];
  return PROJECT_DATA.map((data) => {
    const text = copy.projects[data.id];
    if (!text) throw new Error(`Projeto "${data.id}" sem texto em ${locale}`);
    return {
      ...data,
      ...text,
      metrics: data.metrics.map((metric) => ({ ...metric, label: copy.metrics[metric.key] })),
    };
  });
}

export function getProject(locale: Locale, id: string): Project | undefined {
  return getProjects(locale).find((project) => project.id === id);
}

/** Ids com página de case — alimenta generateStaticParams e o sitemap. */
export const CASE_IDS = PROJECT_DATA.filter((project) => project.hasCase).map((project) => project.id);

/** Case anterior e próximo, para navegar entre eles. */
export function adjacentCases(locale: Locale, id: string) {
  const cases = getProjects(locale).filter((project) => project.hasCase);
  const index = cases.findIndex((project) => project.id === id);
  return {
    previous: index > 0 ? cases[index - 1] : undefined,
    next: index >= 0 && index < cases.length - 1 ? cases[index + 1] : undefined,
  };
}

export function getSnapshot(locale: Locale): SnapshotItem[] {
  const copy = copies[locale];
  return SNAPSHOT.map((item) => ({ value: item.value, label: copy.snapshot[item.key], projectId: item.projectId }));
}
