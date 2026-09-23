import type { SiteContent } from "./types";
import { PROJECT_TAGS, SECTION_IDS, SKILL_ITEMS, contactLinks, navLinks } from "./shared";

export const ptBR: SiteContent = {
  meta: {
    title: "Godzilla — Full Stack Developer",
    description:
      "Portfolio pessoal de Douglas Vinicius Szapak Ferreira (Godzilla), engenheiro fullstack. Projetos, skills e experiência.",
  },
  nav: {
    brand: "GODZILLA.DEV",
    skipToContent: "Pular para o conteúdo",
    links: navLinks({
      about: "Sobre",
      skills: "Skills",
      projects: "Projetos",
      experience: "Experiência",
      contact: "Contato",
    }),
  },
  hero: {
    prompt: "$ whoami",
    title: "GODZILLA",
    subtitle: "Full Stack Developer",
    description:
      "Portfolio pessoal construído com uma stack moderna, mostrando projetos, experiência e forma de trabalhar. Em constante evolução — assim como um kaiju que nunca para de crescer.",
    primaryCta: { label: "Ver projetos", href: `#${SECTION_IDS.projects}` },
    secondaryCta: { label: "Sobre mim", href: `#${SECTION_IDS.about}` },
  },
  about: {
    title: "Sobre mim",
    paragraphs: [
      "Meu nome é Douglas Vinicius Szapak Ferreira — no mercado, também conhecido como Godzilla. Engenheiro de software com mais de 6 anos de experiência entre frontend e backend, passando por migração de sistemas legados, construção de APIs e squads multidisciplinares.",
      "Uso ferramentas de IA (Code Assist e agentes inteligentes) no dia a dia para aumentar produtividade e acelerar o desenvolvimento de soluções.",
    ],
    facts: [
      { label: "Experiência", value: "6+ anos" },
      { label: "Foco", value: "Full Stack" },
      { label: "Stack principal", value: "React & Node.js" },
      { label: "Formação", value: "ADS — Cesumar" },
    ],
  },
  skills: {
    title: "Skills",
    description: "Conjunto de tecnologias e práticas utilizadas no dia a dia.",
    groups: [
      { category: "Frontend", items: SKILL_ITEMS.frontend },
      { category: "Backend", items: SKILL_ITEMS.backend },
      { category: "Dados & Infraestrutura", items: SKILL_ITEMS.data },
      { category: "Testes & Qualidade", items: SKILL_ITEMS.quality },
    ],
  },
  projects: {
    title: "Projetos",
    description: "Iniciativas que liderei ou das quais fiz parte ao longo da carreira.",
    items: [
      {
        name: "Modernização do Ecossistema Discovery — Pravaler",
        description:
          "Liderança da migração de um legado WordPress/PHP com mais de 20 anos para Next.js e Node.js, incluindo a reconstrução completa dos fluxos de simulação, cadastro e atendimento, com mais de 400 testes automatizados.",
        tags: PROJECT_TAGS.pravaler,
      },
      {
        name: "Integração Multi-Backend — Inoa",
        description:
          "Desenvolvimento e manutenção da camada frontend integrada a 16 módulos de backend distintos, com AngularJS, React e TypeScript, em alinhamento técnico contínuo entre múltiplas equipes.",
        tags: PROJECT_TAGS.inoa,
      },
      {
        name: "QualiCloud — SaaS Própria",
        description:
          "Cofundador e líder técnico de uma software house, traduzindo demandas de negócio em produtos fullstack com NestJS, Laravel e React Native junto a uma equipe de desenvolvimento.",
        tags: PROJECT_TAGS.qualicloud,
      },
    ],
  },
  experience: {
    title: "Experiência",
    items: [
      {
        role: "Engenheiro de Software",
        company: "Inoa — Especialistas em Mercado de Capitais",
        period: "Jan 2026 — atual",
        description:
          "Desenvolvimento e manutenção do frontend da plataforma (AngularJS, React e TypeScript), com integração consistente entre 16 módulos de backend mantidos por equipes distintas.",
      },
      {
        role: "Engenheiro de Software",
        company: "Pravaler — Financiamento Estudantil",
        period: "Jun 2022 — Nov 2025",
        description:
          "Liderança da migração de um legado WordPress/PHP para Next.js e Node.js, com mais de 300 mil linhas de código evoluídas, 400+ testes automatizados e reconstrução completa dos fluxos críticos de simulação, cadastro e atendimento.",
      },
      {
        role: "Desenvolvedor Fullstack / Sócio",
        company: "QualiCloud Cloud Solutions",
        period: "Abr 2019 — Nov 2022",
        description:
          "Cofundador e líder técnico de uma equipe de desenvolvimento, transformando demandas de negócio em produtos SaaS fullstack com NestJS, Laravel e React Native.",
      },
      {
        role: "Analista de Desenvolvimento de Sistemas",
        company: "Cristófoli Equipamentos",
        period: "Jul 2015 — Nov 2022",
        description:
          "Desenvolvimento de aplicações MVC e APIs RESTful (PHP, Laravel, Node.js) para um CRM interno usado por cerca de 160 pessoas, integrado ao ERP corporativo.",
      },
    ],
  },
  contact: {
    title: "Contato",
    description: "Vamos conversar? Esses são os melhores canais para me encontrar.",
    links: contactLinks("E-mail"),
  },
  footer: {
    owner: "Godzilla",
    rightsReserved: "Todos os direitos reservados.",
  },
};
