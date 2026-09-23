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
  frontend: ["React", "Next.js", "TypeScript", "AngularJS", "Tailwind CSS"],
  backend: ["Node.js", "NestJS", "Laravel", "PHP", "GraphQL"],
  data: ["PostgreSQL", "MySQL", "MongoDB", "Docker"],
  quality: ["Jest", "Cypress", "React Testing Library", "Storybook"],
};

export const PROJECT_TAGS = {
  pravaler: ["Next.js", "Node.js", "Jest", "GCP"],
  inoa: ["AngularJS", "React", "TypeScript"],
  qualicloud: ["NestJS", "Laravel", "React Native"],
};
