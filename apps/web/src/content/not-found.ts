import type { Locale } from "@/i18n/config";

/** Textos da página 404 (usada tanto na rota inexistente quanto no notFound() das páginas). */
export interface NotFoundCopy {
  title: string;
  lead: string;
  /** "{path}" vira o endereço que a pessoa tentou abrir. */
  command: string;
  home: string;
  projects: string;
  contact: string;
  meta: string;
}

export const NOT_FOUND_COPY: Record<Locale, NotFoundCopy> = {
  "pt-BR": {
    title: "Página não encontrada",
    lead: "O Godzilla passou por aqui e não sobrou nada nesta rota. O endereço pode ter mudado ou nunca ter existido.",
    command: "rota {path} não encontrada",
    home: "Voltar para a home",
    projects: "Ver projetos",
    contact: "Falar comigo",
    meta: "Página não encontrada",
  },
  "en-US": {
    title: "Page not found",
    lead: "Godzilla came through here and nothing was left on this route. The address may have changed or never existed.",
    command: "route {path} not found",
    home: "Back to home",
    projects: "See projects",
    contact: "Get in touch",
    meta: "Page not found",
  },
  "es-ES": {
    title: "Página no encontrada",
    lead: "Godzilla pasó por aquí y no quedó nada en esta ruta. La dirección puede haber cambiado o nunca haber existido.",
    command: "ruta {path} no encontrada",
    home: "Volver al inicio",
    projects: "Ver proyectos",
    contact: "Hablar conmigo",
    meta: "Página no encontrada",
  },
};
