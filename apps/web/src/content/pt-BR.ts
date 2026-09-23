import type { SiteContent } from "./types";
import { EXPERIENCE, PROJECT_TAGS, SECTION_IDS, SKILL_ITEMS, contactLinks, navLinks } from "./shared";

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
      "Meu nome é Douglas Vinicius Szapak Ferreira — no mercado, também conhecido como Godzilla. Sou engenheiro de software full stack sênior, com mais de 9 anos construindo produtos web do levantamento de requisitos até a produção.",
      "Comecei desenvolvendo sistemas corporativos, APIs e integrações na Cristófoli. Depois cofundei a QualiCloud, onde fui sócio e líder técnico de uma equipe que criava produtos SaaS web e mobile. Na Pravaler, participei da modernização de um ecossistema legado com mais de 20 anos — migrando WordPress/PHP para Next.js, Node.js e TypeScript, ajudando a criar uma arquitetura BFF e escrevendo mais de 400 testes automatizados. Na Inoa, atuei como sênior no front-end de uma plataforma integrada a 16 módulos de back-end.",
      "Gosto de código organizado e de times que evoluem juntos: participo de code reviews, decisões de arquitetura e criação de componentes reutilizáveis. No dia a dia, uso ferramentas de IA (Code Assist e agentes) para ganhar produtividade sem abrir mão da qualidade.",
    ],
    facts: [
      { label: "Experiência", value: "9+ anos" },
      { label: "Nível", value: "Sênior" },
      { label: "Stack principal", value: "React · Next.js · Node.js" },
      { label: "Testes automatizados", value: "400+" },
      { label: "Liderança", value: "Ex-sócio e tech lead" },
      { label: "Formação", value: "ADS — Cesumar" },
    ],
  },
  skills: {
    title: "Skills",
    description: "Tecnologias e práticas que usei em produção ao longo da carreira.",
    groups: [
      { category: "Frontend", items: SKILL_ITEMS.frontend },
      { category: "Backend", items: SKILL_ITEMS.backend },
      { category: "Dados & Infraestrutura", items: SKILL_ITEMS.data },
      { category: "Testes & Qualidade", items: SKILL_ITEMS.quality },
      { category: "Arquitetura", items: SKILL_ITEMS.architecture },
    ],
  },
  projects: {
    title: "Projetos",
    description: "Iniciativas das quais fiz parte ao longo da carreira.",
    items: [
      {
        name: "Reconstrução do legado — Canais EPA · Pravaler",
        description:
          "No time “Estratégia para Ação”, reconstrução do sistema legado da empresa: simulação, pré-simulação, cadastro, crédito, atendimento, website e formulários, com Next.js, Node.js, shadcn/ui e Tailwind CSS rodando no Google Cloud Platform.",
        tags: PROJECT_TAGS.epa,
      },
      {
        name: "Modernização do Discovery — Pravaler",
        description:
          "Migração de um ecossistema WordPress/PHP com mais de 20 anos para Next.js, Node.js e TypeScript (SPA, SSR e SSG), com nova arquitetura BFF para o portal e o marketplace e mais de 400 testes unitários e de integração.",
        tags: PROJECT_TAGS.discovery,
      },
      {
        name: "Plataforma de mercado de capitais — Inoa",
        description:
          "Evolução do front-end em AngularJS, TypeScript e React integrado a 16 módulos de back-end de equipes distintas, com componentes reutilizáveis, testes automatizados e consistência entre interface e serviços.",
        tags: PROJECT_TAGS.inoa,
      },
      {
        name: "Produtos SaaS — QualiCloud",
        description:
          "Como sócio e líder técnico, transformei necessidades de negócio em produtos SaaS web e mobile, da definição de arquitetura à entrega, com NestJS, Laravel, React e React Native.",
        tags: PROJECT_TAGS.qualicloud,
      },
    ],
  },
  experience: {
    title: "Experiência",
    items: [
      {
        role: "Engenheiro de Software Full Stack Sênior",
        company: EXPERIENCE.inoa.company,
        period: "jan 2026 — jul 2026",
        location: "Rio de Janeiro, RJ · Remoto",
        description:
          "Desenvolvimento e manutenção da plataforma da Inoa, com foco no front-end em AngularJS integrado a 16 módulos de back-end mantidos por diferentes times.",
        highlights: [
          "Novas funcionalidades, fluxos de negócio e integrações com as APIs dos 16 módulos de back-end.",
          "Criação e manutenção de componentes reutilizáveis em AngularJS, TypeScript e React.",
          "Alinhamento técnico com múltiplas equipes de back-end.",
          "Code reviews, decisões técnicas e evolução da arquitetura front-end.",
          "Testes automatizados com Jest e React Testing Library; componentes documentados no Storybook.",
        ],
        technologies: EXPERIENCE.inoa.technologies,
      },
      {
        role: "Engenheiro de Software Full Stack Pleno",
        company: EXPERIENCE.pravalerPleno.company,
        period: "jun 2023 — nov 2025",
        location: EXPERIENCE.pravalerPleno.location,
        description:
          "Modernização do ecossistema digital da Pravaler. A partir de 2025, no time “Estratégia para Ação (EPA)”, com a missão de reconstruir o sistema legado da empresa.",
        highlights: [
          "Reconstrução dos fluxos críticos de simulação, pré-simulação, cadastro, crédito e atendimento.",
          "Interfaces e serviços com Node.js e Next.js, usando Material UI, shadcn/ui e Tailwind CSS.",
          "Integração entre front-end e APIs e evolução da arquitetura para escalar com facilidade de manutenção.",
          "Aplicações rodando no Google Cloud Platform, substituindo gradualmente as estruturas legadas.",
          "Testes unitários e de integração com Jest para reduzir regressões.",
        ],
        technologies: EXPERIENCE.pravalerPleno.technologies,
      },
      {
        role: "Engenheiro de Software Full Stack Júnior",
        company: EXPERIENCE.pravalerJunior.company,
        period: "jul 2022 — jul 2023",
        location: "Remoto",
        description:
          "Time de Aquisição e Discovery, com foco em captação de clientes, experiência do usuário, performance e SEO.",
        highlights: [
          "Migração de um legado WordPress/PHP com mais de 20 anos para Next.js, Node.js e TypeScript (SPA, SSR e SSG).",
          "Criação de uma nova arquitetura BFF para o portal e o marketplace, com estudos de microsserviços e integrações.",
          "Mais de 400 testes unitários e de integração com Jest, React Testing Library e Cypress.",
          "Migração de aplicações para Google Cloud Platform, Docker e CI/CD.",
          "Novo portal/rebrand, adoção de TypeScript e contribuições para a cultura Agile.",
        ],
        technologies: EXPERIENCE.pravalerJunior.technologies,
      },
      {
        role: "Desenvolvedor Full Stack — Sócio",
        company: EXPERIENCE.qualicloud.company,
        period: "abr 2019 — nov 2022",
        location: EXPERIENCE.qualicloud.location,
        description:
          "Sócio-proprietário e líder técnico de uma empresa de soluções SaaS, responsável pela equipe e pelos produtos da concepção à entrega.",
        highlights: [
          "Liderança técnica: alinhamentos, distribuição de tarefas e acompanhamento das entregas.",
          "Tradução de necessidades de negócio em soluções técnicas viáveis.",
          "Definição e evolução da arquitetura das aplicações web e mobile.",
          "APIs e integrações com Node.js, NestJS, PHP e Laravel; apps com React e React Native.",
        ],
        technologies: EXPERIENCE.qualicloud.technologies,
      },
      {
        role: "Analista de Desenvolvimento de Sistemas",
        company: EXPERIENCE.cristofoli.company,
        period: "jul 2017 — jun 2022",
        location: EXPERIENCE.cristofoli.location,
        description:
          "Desenvolvimento e evolução de sistemas corporativos, do levantamento de requisitos à implementação, manutenção e melhoria contínua.",
        highlights: [
          "Aplicações web e sistemas internos com PHP, Laravel, JavaScript, jQuery e WordPress.",
          "Integração entre sistemas e bancos de dados, APIs, consultas SQL e rotinas em PL/SQL.",
          "Modernização de sistemas legados e eliminação de gargalos nos processos internos.",
          "Contato próximo com as áreas de negócio para transformar requisitos em funcionalidades.",
        ],
        technologies: EXPERIENCE.cristofoli.technologies,
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
