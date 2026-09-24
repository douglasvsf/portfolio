import type { ExperienceItem, Project, SkillGroup } from "@portfolio/shared";

export interface LinkItem {
  label: string;
  href: string;
}

/** Sistema publicado junto com o site (seção "Sistemas"). */
export interface SystemItem {
  name: string;
  description: string;
  href: string;
  /** Prévia (screenshot) em /public. */
  image: string;
  tags: string[];
}

export interface Photo {
  src: string;
  alt: string;
  width: number;
  height: number;
}

export interface Fact {
  label: string;
  value: string;
}

export type ContactIcon = "mail" | "linkedin";

export interface ContactLink extends LinkItem {
  value: string;
  icon: ContactIcon;
}

/** Cabeçalho comum a todas as seções da página. */
export interface SectionCopy {
  title: string;
  description?: string;
}

/**
 * Todo o texto do site para um idioma. Os itens (projetos, skills,
 * experiência) usam os mesmos tipos da API em @portfolio/shared, para que o
 * conteúdo possa voltar a vir do backend sem mudar os componentes.
 */
export interface SiteContent {
  meta: {
    title: string;
    description: string;
  };
  nav: {
    brand: string;
    skipToContent: string;
    links: LinkItem[];
  };
  hero: {
    prompt: string;
    title: string;
    subtitle: string;
    description: string;
    primaryCta: LinkItem;
    secondaryCta: LinkItem;
  };
  about: SectionCopy & {
    photo?: Photo;
    paragraphs: string[];
    facts: Fact[];
  };
  skills: SectionCopy & { groups: SkillGroup[] };
  projects: SectionCopy & { items: Project[] };
  experience: SectionCopy & { items: ExperienceItem[] };
  contact: SectionCopy & { links: ContactLink[] };
  systems: SectionCopy & { items: SystemItem[]; openLabel: string };
  footer: {
    owner: string;
    rightsReserved: string;
    links: LinkItem[];
  };
}
