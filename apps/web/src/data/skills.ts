export interface SkillGroup {
  category: string;
  items: string[];
}

// Conteúdo fictício — substituir pelas skills reais.
export const skillGroups: SkillGroup[] = [
  {
    category: "Frontend",
    items: ["TypeScript", "React", "Next.js", "Tailwind CSS"],
  },
  {
    category: "Backend",
    items: ["Node.js", "NestJS", "REST APIs", "PostgreSQL"],
  },
  {
    category: "Infraestrutura",
    items: ["Docker", "CI/CD", "Vercel", "AWS"],
  },
  {
    category: "Práticas",
    items: ["Testes automatizados", "Code review", "Arquitetura limpa", "Observabilidade"],
  },
];
