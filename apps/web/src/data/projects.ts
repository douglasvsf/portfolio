export interface Project {
  name: string;
  description: string;
  tags: string[];
  link?: string;
}

// Conteúdo fictício — substituir pelos projetos reais.
export const projects: Project[] = [
  {
    name: "Projeto Kaiju Dashboard",
    description:
      "Dashboard fictício de monitoramento em tempo real, construído para demonstrar arquitetura escalável no frontend.",
    tags: ["Next.js", "TypeScript", "Tailwind CSS"],
    link: "#",
  },
  {
    name: "API Radioactive Commerce",
    description:
      "API REST fictícia de e-commerce com foco em performance, boas práticas e testes automatizados.",
    tags: ["NestJS", "PostgreSQL", "Docker"],
    link: "#",
  },
  {
    name: "Monitor Kaiju",
    description:
      "Ferramenta fictícia de observabilidade para acompanhar métricas e logs de aplicações distribuídas.",
    tags: ["Node.js", "Grafana", "Redis"],
    link: "#",
  },
];
