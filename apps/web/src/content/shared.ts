/**
 * Dados que não mudam entre idiomas. Os ids das seções também ficam aqui: a
 * âncora (#projects) é a mesma em todos os idiomas, então trocar de idioma
 * mantém o visitante na mesma seção.
 */
export const SECTION_IDS = {
  hero: "hero",
  about: "about",
  skills: "skills",
  projects: "projects",
  experience: "experience",
  contact: "contact",
  systems: "products",
} as const;

export const CONTACT = {
  email: "doug.szapak@gmail.com",
  linkedinUrl: "https://www.linkedin.com/in/douglas-vinicius-szapak-ferreira-2ba7a115b/",
  linkedinLabel: "linkedin.com/in/douglas-vinicius-szapak-ferreira",
} as const;

const s = SECTION_IDS;

const NAV_SECTIONS = ["about", "skills", "projects", "experience", "contact", "systems"] as const;

/** Links do menu: as seções na ordem da página (cada idioma só fornece os rótulos). */
export function navLinks(labels: Record<(typeof NAV_SECTIONS)[number], string>) {
  return NAV_SECTIONS.map((key) => ({ href: `#${s[key]}`, label: labels[key] }));
}

/**
 * Sistemas publicados junto com o site (seção "Produtos"). Nome, link, prévia
 * e tags são iguais em todos os idiomas — cada idioma só fornece a descrição.
 */
export function systemItems(descriptions: Record<"spotify" | "stocks" | "designSystem", string>) {
  return [
    {
      name: "GODZILLA Spotify Stats",
      href: SPOTIFY_LINK.href,
      image: "/images/systems/spotify.webp",
      description: descriptions.spotify,
      tags: ["Next.js", "Spotify Web API", "OAuth PKCE", "Last.fm API", "Recharts"],
    },
    {
      name: "Kaiju Stocks",
      href: STOCKS_LINK.href,
      image: "/images/systems/stocks.webp",
      description: descriptions.stocks,
      tags: ["Next.js", "Server Components", "brapi API", "Recharts"],
    },
    {
      name: "Design System",
      href: DESIGN_SYSTEM_LINK.href,
      image: "/images/systems/design-system.webp",
      description: descriptions.designSystem,
      tags: ["React", "Radix UI", "Tailwind CSS", "Storybook"],
    },
  ];
}

export function contactLinks(emailLabel: string) {
  return [
    { icon: "mail" as const, label: emailLabel, value: CONTACT.email, href: `mailto:${CONTACT.email}` },
    { icon: "linkedin" as const, label: "LinkedIn", value: CONTACT.linkedinLabel, href: CONTACT.linkedinUrl },
  ];
}

/** GODZILLA Spotify Stats — dashboard de estatísticas musicais (ver src/app/spotify). */
export const SPOTIFY_LINK = { label: "Spotify Stats", href: "/spotify" };

/** Kaiju Stocks — cotações da B3, rota do próprio app (ver src/app/stocks). */
export const STOCKS_LINK = { label: "Kaiju Stocks", href: "/stocks" };

/** Storybook do Design System, publicado junto com o site (ver next.config.ts). */
export const DESIGN_SYSTEM_LINK = { label: "Design System", href: "/design-system" };

export const PROFILE_PHOTO = { src: "/images/douglas.jpg", width: 390, height: 396 } as const;

export const SKILL_ITEMS = {
  frontend: [
    "React",
    "Next.js",
    "TypeScript",
    "JavaScript",
    "AngularJS",
    "React Native",
    "Tailwind CSS",
    "shadcn/ui",
    "Material UI",
    "Styled Components",
    "Sass",
  ],
  backend: ["Node.js", "NestJS", "Express", "PHP", "Laravel", "GraphQL", "Apollo", "REST APIs"],
  data: ["PostgreSQL", "MySQL", "MongoDB", "Oracle", "PL/SQL", "Docker", "Google Cloud Platform", "CI/CD", "Git"],
  quality: ["Jest", "React Testing Library", "Cypress", "Storybook", "Code Review"],
  architecture: ["BFF", "Microservices", "Atomic Design", "DDD", "SOLID", "SPA · SSR · SSG"],
};

export const PROJECT_TAGS = {
  epa: ["Next.js", "Node.js", "shadcn/ui", "Tailwind CSS", "GCP"],
  discovery: ["Next.js", "TypeScript", "BFF", "Jest", "Cypress"],
  inoa: ["AngularJS", "React", "TypeScript", "Storybook"],
  qualicloud: ["NestJS", "Laravel", "React Native"],
};

/** Empresa, local e stack de cada experiência — só cargo e textos são traduzidos. */
export const EXPERIENCE = {
  inoa: {
    company: "Inoa",
    technologies: ["AngularJS", "TypeScript", "JavaScript", "React", "Next.js", "Node.js", "Jest", "React Testing Library", "Storybook"],
  },
  pravalerPleno: {
    company: "Pravaler",
    location: "São Paulo, SP",
    technologies: ["Node.js", "Next.js", "React", "TypeScript", "Material UI", "shadcn/ui", "Tailwind CSS", "Jest", "GraphQL", "Docker", "GCP"],
  },
  pravalerJunior: {
    company: "Pravaler",
    technologies: ["Next.js", "Node.js", "TypeScript", "Express", "GraphQL", "PHP", "Laravel", "PostgreSQL", "MongoDB", "Docker", "GCP", "Cypress"],
  },
  qualicloud: {
    company: "QualiCloud Soluções em Nuvem",
    location: "Campo Mourão, PR",
    technologies: ["Node.js", "NestJS", "PHP", "Laravel", "React", "React Native", "Oracle", "MySQL"],
  },
  cristofoli: {
    company: "Cristófoli Equipamentos de Biossegurança",
    location: "Campo Mourão, PR",
    technologies: ["PHP", "Laravel", "JavaScript", "jQuery", "WordPress", "MySQL", "PL/SQL"],
  },
};
