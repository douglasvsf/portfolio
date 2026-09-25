import type { ProjectsCopy } from "./types";

export const enUS: ProjectsCopy = {
  metrics: {
    legacyYears: "years of legacy",
    stack: "stack",
    cloud: "cloud",
    monthlyVisits: "visits per month",
    peakVisits: "peak visits",
    linesOfCode: "lines of code",
    automatedTests: "automated tests",
    backendModules: "back-end modules integrated",
    frontendStack: "on the front end",
    role: "and co-founder",
    platforms: "SaaS products",
  },
  snapshot: {
    legacyYears: "years of legacy modernized",
    monthlyVisits: "visits per month",
    backendModules: "integrated modules",
    automatedTests: "automated tests",
  },
  projects: {
    "pravaler-discovery": {
      title: "Discovery modernization",
      summary:
        "Migration of a 20+ year-old WordPress/PHP ecosystem to Next.js, Node.js and TypeScript, with a BFF architecture for the portal and the marketplace.",
      case: {
        context:
          "On Pravaler's Acquisition and Discovery team, the focus was customer acquisition, user experience, performance and SEO. The portal and the marketplace ran on a WordPress/PHP ecosystem more than 20 years old.",
        challenge:
          "Replace that legacy with a modern architecture on a channel with 400K+ visits per month (peaking at 650K), keeping performance, SEO and user experience in sight.",
        role: [
          "Migrated the WordPress/PHP legacy to Next.js, Node.js and TypeScript, with SPA, SSR and SSG pages.",
          "Built the new BFF architecture for the portal and the marketplace, including microservice and integration studies.",
          "400+ unit and integration tests with Jest, React Testing Library and Cypress.",
          "Moved applications to Google Cloud Platform, Docker and CI/CD.",
          "Took part in the new portal/rebrand and in the team's TypeScript adoption.",
        ],
        architecture: [
          { label: "WordPress/PHP", detail: "20+ year-old legacy", legacy: true },
          { label: "Next.js + React", detail: "SPA · SSR · SSG" },
          { label: "Node.js BFF", detail: "portal and marketplace" },
          { label: "Services and APIs", detail: "integrations" },
          { label: "Google Cloud Platform", detail: "Docker · CI/CD" },
        ],
        result: "Portal and marketplace migrated to Next.js, Node.js and TypeScript, on the new BFF architecture and with a new portal/rebrand.",
        decisions: [
          {
            title: "A BFF between screens and services",
            description: "A Node.js layer centralizes integrations and hands the portal and the marketplace data shaped the way each screen needs it.",
          },
          {
            title: "Rendering chosen per page",
            description: "SPA, SSR and SSG live in the same codebase: each page uses the strategy that serves the team's focus on performance and SEO.",
          },
          {
            title: "Layered testing",
            description: "Jest and React Testing Library for units and integrations, Cypress for in-browser flows — 400+ tests in total.",
          },
          {
            title: "Containerized infrastructure",
            description: "Applications moved to Google Cloud Platform with Docker and CI/CD pipelines.",
          },
        ],
      },
    },
    "pravaler-canais-epa": {
      title: "Legacy rebuild — EPA channels",
      summary:
        "On the “Strategy for Action” team, rebuilt the legacy system: simulation, pre-simulation, sign-up, credit, customer service, website and forms.",
      case: {
        context:
          "In 2025, on Pravaler's “Strategy for Action” (EPA) team, the mission was to rebuild the company's legacy system — the simulation, pre-simulation, sign-up, credit, customer service, website and forms channels.",
        challenge:
          "Rebuild business-critical flows that depended on a 20+ year-old legacy, with an architecture that scales and stays easy to maintain.",
        role: [
          "Rebuilt the simulation, pre-simulation, sign-up, credit and customer service flows.",
          "Interfaces and services with Next.js and Node.js, using shadcn/ui, Tailwind CSS and Material UI.",
          "Front-end to API integration and architecture evolution.",
          "Applications on Google Cloud Platform, gradually replacing the legacy structures.",
          "Unit and integration tests with Jest to reduce regressions.",
        ],
        architecture: [
          { label: "Legacy system", detail: "20+ years", legacy: true },
          { label: "EPA channels", detail: "simulation · sign-up · credit · service" },
          { label: "Next.js + shadcn/ui", detail: "interfaces with Tailwind CSS" },
          { label: "Node.js", detail: "services and API integration" },
          { label: "Google Cloud Platform" },
        ],
        result: "Business-critical flows rebuilt and running on Google Cloud Platform, gradually replacing the legacy structures.",
        decisions: [
          {
            title: "Gradual replacement",
            description: "Instead of a single cutover, the new applications took the legacy's place step by step, flow by flow.",
          },
          {
            title: "Standardized interface",
            description: "shadcn/ui and Tailwind CSS as the visual foundation to keep the rebuilt channels consistent.",
          },
          {
            title: "Tests against regressions",
            description: "Unit and integration tests with Jest alongside the rebuild of the critical flows.",
          },
        ],
      },
    },
    inoa: {
      title: "Capital markets platform",
      summary: "Front end in AngularJS, TypeScript and React integrated with 16 back-end modules built by different teams.",
      case: {
        context:
          "At Inoa, I worked as a senior engineer on the front end of a capital markets platform integrated with 16 back-end modules maintained by different teams.",
        challenge: "Evolve an AngularJS front end that talks to 16 services from different teams, keeping the interface and the services consistent.",
        role: [
          "New features, business flows and integrations with the APIs of the 16 back-end modules.",
          "Built and maintained reusable components in AngularJS, TypeScript and React.",
          "Technical alignment with multiple back-end teams.",
          "Code reviews, technical decisions and front-end architecture evolution.",
          "Automated tests with Jest and React Testing Library; components documented in Storybook.",
        ],
        architecture: [
          { label: "Front end", detail: "AngularJS + React · TypeScript" },
          { label: "Reusable components", detail: "documented in Storybook" },
          { label: "API integrations", detail: "business flows" },
          { label: "16 back-end modules", detail: "different teams" },
        ],
        decisions: [
          {
            title: "Reusable, documented components",
            description: "Components in AngularJS, TypeScript and React documented in Storybook, to reuse them and keep the interface consistent.",
          },
          {
            title: "Alignment across teams",
            description: "Integrating 16 modules requires constant technical alignment with the back-end teams on contracts and flows.",
          },
          {
            title: "Automated tests",
            description: "Jest and React Testing Library covering front-end components and flows.",
          },
        ],
      },
    },
    qualicloud: {
      title: "SaaS products",
      summary: "As partner and tech lead, I turned business needs into web and mobile SaaS products, from architecture to delivery.",
      case: {
        context: "I co-founded QualiCloud, a SaaS solutions company, where I was a partner and the tech lead of the team building web and mobile products.",
        challenge: "Turn business needs into viable technical solutions and take products from concept to delivery.",
        role: [
          "Technical leadership: alignment, task distribution and delivery follow-up.",
          "Translated business needs into viable technical solutions.",
          "Defined and evolved the architecture of the web and mobile applications.",
          "APIs and integrations with Node.js, NestJS, PHP and Laravel; apps with React and React Native.",
        ],
        architecture: [
          { label: "Business needs" },
          { label: "Architecture and stack", detail: "technical definition" },
          { label: "APIs and integrations", detail: "Node.js · NestJS · PHP · Laravel" },
          { label: "SaaS products", detail: "web (React) · mobile (React Native)" },
        ],
        decisions: [
          {
            title: "Technical leadership close to the business",
            description: "Alignment, task distribution and delivery follow-up, translating business needs into technical solutions.",
          },
          {
            title: "React on web and mobile",
            description: "React for the web applications and React Native for mobile, with APIs in NestJS and Laravel.",
          },
        ],
      },
    },
    "kaiju-stocks": {
      title: "Kaiju Stocks",
      summary:
        "B3 and crypto quotes, price history charts and a portfolio tracker with average price, dividends, a CDI benchmark and B3 spreadsheet import.",
    },
    "spotify-stats": {
      title: "GODZILLA Spotify Stats",
      summary: "Music stats with Spotify OAuth, Last.fm and a live showcase: top artists, tracks, genres and what's playing right now.",
    },
    "godzilla-ui": {
      title: "GODZILLA UI",
      summary: "The Design System behind every app: tokens, accessible components, i18n and documentation in Storybook.",
    },
  },
};
