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
} as const;

export const CONTACT = {
  email: "doug.szapak@gmail.com",
  linkedinUrl: "https://www.linkedin.com/in/douglas-vinicius-szapak-ferreira-2ba7a115b/",
  linkedinLabel: "linkedin.com/in/douglas-vinicius-szapak-ferreira",
} as const;

const s = SECTION_IDS;

/** Links do menu na ordem das seções — cada idioma só fornece os rótulos. */
export function navLinks(labels: Record<"about" | "skills" | "projects" | "experience" | "contact", string>) {
  return (["about", "skills", "projects", "experience", "contact"] as const).map((key) => ({
    href: `#${s[key]}`,
    label: labels[key],
  }));
}

export function contactLinks(emailLabel: string) {
  return [
    { icon: "mail" as const, label: emailLabel, value: CONTACT.email, href: `mailto:${CONTACT.email}` },
    { icon: "linkedin" as const, label: "LinkedIn", value: CONTACT.linkedinLabel, href: CONTACT.linkedinUrl },
  ];
}

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
