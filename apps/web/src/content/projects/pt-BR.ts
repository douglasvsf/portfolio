import type { ProjectsCopy } from "./types";

export const ptBR: ProjectsCopy = {
  metrics: {
    legacyYears: "anos de legado",
    stack: "stack",
    cloud: "cloud",
    monthlyVisits: "visitas por mês",
    peakVisits: "pico de visitas",
    linesOfCode: "linhas de código",
    automatedTests: "testes automatizados",
    backendModules: "módulos de back-end integrados",
    frontendStack: "no front-end",
    role: "e sócio-fundador",
    platforms: "produtos SaaS",
  },
  snapshot: {
    legacyYears: "anos de legado modernizado",
    monthlyVisits: "visitas por mês",
    backendModules: "módulos integrados",
    automatedTests: "testes automatizados",
  },
  projects: {
    "pravaler-discovery": {
      title: "Modernização do Discovery",
      summary:
        "Migração de um ecossistema WordPress/PHP com mais de 20 anos para Next.js, Node.js e TypeScript, com arquitetura BFF para o portal e o marketplace.",
      case: {
        context:
          "No time de Aquisição e Discovery da Pravaler, o foco era captação de clientes, experiência do usuário, performance e SEO. O portal e o marketplace rodavam sobre um ecossistema WordPress/PHP com mais de 20 anos.",
        challenge:
          "Substituir esse legado por uma arquitetura moderna em um canal com mais de 400 mil visitas por mês (e picos de 650 mil), sem perder de vista performance, SEO e experiência do usuário.",
        role: [
          "Migração do legado WordPress/PHP para Next.js, Node.js e TypeScript, com páginas em SPA, SSR e SSG.",
          "Criação da nova arquitetura BFF para o portal e o marketplace, com estudos de microsserviços e integrações.",
          "Mais de 400 testes unitários e de integração com Jest, React Testing Library e Cypress.",
          "Migração de aplicações para Google Cloud Platform, Docker e CI/CD.",
          "Participação no novo portal/rebrand e na adoção de TypeScript pelo time.",
        ],
        architecture: [
          { label: "WordPress/PHP", detail: "legado de 20+ anos", legacy: true },
          { label: "Next.js + React", detail: "SPA · SSR · SSG" },
          { label: "BFF em Node.js", detail: "portal e marketplace" },
          { label: "Serviços e APIs", detail: "integrações" },
          { label: "Google Cloud Platform", detail: "Docker · CI/CD" },
        ],
        result:
          "Portal e marketplace migrados para Next.js, Node.js e TypeScript, sobre a nova arquitetura BFF e com novo portal/rebrand.",
        decisions: [
          {
            title: "BFF entre as telas e os serviços",
            description: "Uma camada em Node.js concentra as integrações e entrega ao portal e ao marketplace os dados no formato de que cada tela precisa.",
          },
          {
            title: "Renderização escolhida por página",
            description: "SPA, SSR e SSG convivem na mesma base: cada página usa a estratégia que atende ao foco do time em performance e SEO.",
          },
          {
            title: "Testes em camadas",
            description: "Jest e React Testing Library para unidades e integrações, Cypress para os fluxos no navegador — mais de 400 testes ao todo.",
          },
          {
            title: "Infra em contêineres",
            description: "Aplicações migradas para o Google Cloud Platform com Docker e pipelines de CI/CD.",
          },
        ],
      },
    },
    "pravaler-canais-epa": {
      title: "Reconstrução do legado — Canais EPA",
      summary:
        "No time “Estratégia para Ação”, reconstrução do sistema legado: simulação, pré-simulação, cadastro, crédito, atendimento, website e formulários.",
      case: {
        context:
          "Em 2025, no time “Estratégia para Ação” (EPA) da Pravaler, a missão era reconstruir o sistema legado da empresa — os canais de simulação, pré-simulação, cadastro, crédito, atendimento, website e formulários.",
        challenge:
          "Reconstruir fluxos críticos do negócio que dependiam de um legado com mais de 20 anos, com uma arquitetura que escalasse e continuasse fácil de manter.",
        role: [
          "Reconstrução dos fluxos de simulação, pré-simulação, cadastro, crédito e atendimento.",
          "Interfaces e serviços com Next.js e Node.js, usando shadcn/ui, Tailwind CSS e Material UI.",
          "Integração entre front-end e APIs e evolução da arquitetura.",
          "Aplicações no Google Cloud Platform, substituindo gradualmente as estruturas legadas.",
          "Testes unitários e de integração com Jest para reduzir regressões.",
        ],
        architecture: [
          { label: "Sistema legado", detail: "20+ anos", legacy: true },
          { label: "Canais EPA", detail: "simulação · cadastro · crédito · atendimento" },
          { label: "Next.js + shadcn/ui", detail: "interfaces com Tailwind CSS" },
          { label: "Node.js", detail: "serviços e integração com APIs" },
          { label: "Google Cloud Platform" },
        ],
        result: "Fluxos críticos reconstruídos rodando no Google Cloud Platform, substituindo gradualmente as estruturas legadas.",
        decisions: [
          {
            title: "Substituição gradual",
            description: "Em vez de uma virada única, as aplicações novas foram ocupando o lugar do legado aos poucos, fluxo a fluxo.",
          },
          {
            title: "Interface padronizada",
            description: "shadcn/ui e Tailwind CSS como base visual para manter consistência entre os canais reconstruídos.",
          },
          {
            title: "Testes contra regressão",
            description: "Testes unitários e de integração com Jest acompanhando a reconstrução dos fluxos críticos.",
          },
        ],
      },
    },
    inoa: {
      title: "Plataforma de mercado de capitais",
      summary:
        "Front-end em AngularJS, TypeScript e React integrado a 16 módulos de back-end desenvolvidos por equipes diferentes.",
      case: {
        context:
          "Na Inoa, atuei como engenheiro sênior no front-end de uma plataforma de mercado de capitais integrada a 16 módulos de back-end, mantidos por equipes diferentes.",
        challenge:
          "Evoluir um front-end em AngularJS que conversa com 16 serviços de times distintos, mantendo a consistência entre interface e serviços.",
        role: [
          "Novas funcionalidades, fluxos de negócio e integrações com as APIs dos 16 módulos de back-end.",
          "Criação e manutenção de componentes reutilizáveis em AngularJS, TypeScript e React.",
          "Alinhamento técnico com múltiplas equipes de back-end.",
          "Code reviews, decisões técnicas e evolução da arquitetura front-end.",
          "Testes automatizados com Jest e React Testing Library; componentes documentados no Storybook.",
        ],
        architecture: [
          { label: "Front-end", detail: "AngularJS + React · TypeScript" },
          { label: "Componentes reutilizáveis", detail: "documentados no Storybook" },
          { label: "Integrações com APIs", detail: "fluxos de negócio" },
          { label: "16 módulos de back-end", detail: "equipes diferentes" },
        ],
        decisions: [
          {
            title: "Componentes reutilizáveis e documentados",
            description: "Componentes em AngularJS, TypeScript e React documentados no Storybook, para reaproveitar e manter a interface consistente.",
          },
          {
            title: "Alinhamento entre times",
            description: "Integrar 16 módulos exige alinhamento técnico constante com as equipes de back-end sobre contratos e fluxos.",
          },
          {
            title: "Testes automatizados",
            description: "Jest e React Testing Library cobrindo componentes e fluxos do front-end.",
          },
        ],
      },
    },
    qualicloud: {
      title: "Produtos SaaS",
      summary: "Como sócio e líder técnico, transformei necessidades de negócio em produtos SaaS web e mobile, da arquitetura à entrega.",
      case: {
        context:
          "Cofundei a QualiCloud, empresa de soluções SaaS, onde fui sócio e líder técnico da equipe que criava produtos web e mobile.",
        challenge: "Transformar necessidades de negócio em soluções técnicas viáveis e levar os produtos da concepção à entrega.",
        role: [
          "Liderança técnica: alinhamentos, distribuição de tarefas e acompanhamento das entregas.",
          "Tradução de necessidades de negócio em soluções técnicas viáveis.",
          "Definição e evolução da arquitetura das aplicações web e mobile.",
          "APIs e integrações com Node.js, NestJS, PHP e Laravel; apps com React e React Native.",
        ],
        architecture: [
          { label: "Necessidades de negócio" },
          { label: "Arquitetura e stack", detail: "definição técnica" },
          { label: "APIs e integrações", detail: "Node.js · NestJS · PHP · Laravel" },
          { label: "Produtos SaaS", detail: "web (React) · mobile (React Native)" },
        ],
        decisions: [
          {
            title: "Liderança técnica perto do negócio",
            description: "Alinhamentos, distribuição de tarefas e acompanhamento das entregas, traduzindo necessidades de negócio em soluções técnicas.",
          },
          {
            title: "React no web e no mobile",
            description: "React nas aplicações web e React Native no mobile, com APIs em NestJS e Laravel.",
          },
        ],
      },
    },
    "kaiju-stocks": {
      title: "Kaiju Stocks",
      summary:
        "Cotações da B3 e cripto, histórico com gráficos e uma carteira com preço médio, proventos, comparação com o CDI e importação da planilha da B3.",
    },
    "spotify-stats": {
      title: "GODZILLA Spotify Stats",
      summary: "Estatísticas musicais com OAuth da Spotify, Last.fm e vitrine ao vivo: top artistas, músicas, gêneros e o que está tocando agora.",
    },
    "godzilla-ui": {
      title: "GODZILLA UI",
      summary: "O Design System que dá cara a todos os sistemas: tokens, componentes acessíveis, i18n e documentação no Storybook.",
    },
  },
};
