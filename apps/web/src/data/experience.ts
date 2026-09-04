export interface ExperienceItem {
  role: string;
  company: string;
  period: string;
  description: string;
}

// Conteúdo fictício — substituir pela experiência real.
export const experience: ExperienceItem[] = [
  {
    role: "Full Stack Developer Sênior",
    company: "Empresa Fictícia S.A.",
    period: "2023 — atual",
    description:
      "Responsável por arquitetura e desenvolvimento de produtos web escaláveis, liderando decisões técnicas do frontend ao backend.",
  },
  {
    role: "Full Stack Developer Pleno",
    company: "Outra Empresa Ltda.",
    period: "2021 — 2023",
    description:
      "Desenvolvimento de features de ponta a ponta, integração com APIs externas e melhoria contínua de performance.",
  },
  {
    role: "Desenvolvedor Júnior",
    company: "Primeira Empresa",
    period: "2019 — 2021",
    description:
      "Início de carreira com foco em frontend, aprendendo boas práticas de código e trabalho em equipe.",
  },
];
