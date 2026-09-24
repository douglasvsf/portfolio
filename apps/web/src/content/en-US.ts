import type { SiteContent } from "./types";
import { DESIGN_SYSTEM_LINK, EXPERIENCE, PROFILE_PHOTO, PROJECT_TAGS, SECTION_IDS, SKILL_ITEMS, contactLinks, navLinks, systemLinks } from "./shared";

export const enUS: SiteContent = {
  meta: {
    title: "Douglas Szapak — Senior Full Stack Software Engineer",
    description:
      "Douglas Szapak is a senior full stack software engineer with 9+ years of experience in React, Next.js and Node.js. Explore projects, experience and skills.",
  },
  nav: {
    brand: "GODZILLA.DEV",
    skipToContent: "Skip to content",
    links: navLinks({
      about: "About",
      skills: "Skills",
      projects: "Projects",
      experience: "Experience",
      contact: "Contact",
    }),
    systems: {
      label: "Systems",
      items: systemLinks({
        spotify: "Your Spotify stats: top artists, tracks, genres and what's playing now.",
        stocks: "B3 stock quotes with charts for gainers, losers, sectors and history.",
        designSystem: "The site's component library, documented in Storybook.",
      }),
    },
  },
  hero: {
    prompt: "$ whoami",
    title: "GODZILLA",
    subtitle: "Full Stack Developer",
    description:
      "A personal portfolio built on a modern stack, showcasing projects, experience and the way I work. Always evolving — just like a kaiju that never stops growing.",
    primaryCta: { label: "See projects", href: `#${SECTION_IDS.projects}` },
    secondaryCta: { label: "About me", href: `#${SECTION_IDS.about}` },
  },
  about: {
    title: "About me",
    photo: { ...PROFILE_PHOTO, alt: "Photo of Douglas Szapak smiling outdoors" },
    paragraphs: [
      "My name is Douglas Vinicius Szapak Ferreira — also known in the industry as Godzilla. I'm a senior full stack software engineer with 9+ years of experience building web products from requirements all the way to production.",
      "I started out building corporate systems, APIs and integrations at Cristófoli. Then I co-founded QualiCloud, where I was a partner and tech lead of a team building web and mobile SaaS products. At Pravaler, I took part in modernizing a 20+ year-old legacy ecosystem — migrating WordPress/PHP to Next.js, Node.js and TypeScript, helping design a BFF architecture and writing 400+ automated tests. At Inoa, I worked as a senior engineer on the frontend of a platform integrated with 16 backend modules.",
      "I care about well-organized code and teams that grow together: I take part in code reviews, architecture decisions and building reusable components. Day to day, I use AI tools (Code Assist and agents) to move faster without compromising quality.",
    ],
    facts: [
      { label: "Experience", value: "9+ years" },
      { label: "Level", value: "Senior" },
      { label: "Main stack", value: "React · Next.js · Node.js" },
      { label: "Automated tests", value: "400+" },
      { label: "Leadership", value: "Former partner & tech lead" },
      { label: "Education", value: "Systems Analysis — Cesumar" },
    ],
  },
  skills: {
    title: "Skills",
    description: "Technologies and practices I've used in production throughout my career.",
    groups: [
      { category: "Frontend", items: SKILL_ITEMS.frontend },
      { category: "Backend", items: SKILL_ITEMS.backend },
      { category: "Data & Infrastructure", items: SKILL_ITEMS.data },
      { category: "Testing & Quality", items: SKILL_ITEMS.quality },
      { category: "Architecture", items: SKILL_ITEMS.architecture },
    ],
  },
  projects: {
    title: "Projects",
    description: "Initiatives I've been part of throughout my career.",
    items: [
      {
        name: "Legacy rebuild — EPA Channels · Pravaler",
        description:
          "On the “Strategy for Action” team, rebuilding the company's legacy system: simulation, pre-simulation, sign-up, credit, customer service, website and forms, with Next.js, Node.js, shadcn/ui and Tailwind CSS running on Google Cloud Platform.",
        tags: PROJECT_TAGS.epa,
      },
      {
        name: "Discovery modernization — Pravaler",
        description:
          "Migration of a 20+ year-old WordPress/PHP ecosystem to Next.js, Node.js and TypeScript (SPA, SSR and SSG), with a new BFF architecture for the portal and marketplace and 400+ unit and integration tests.",
        tags: PROJECT_TAGS.discovery,
      },
      {
        name: "Capital markets platform — Inoa",
        description:
          "Evolving an AngularJS, TypeScript and React frontend integrated with 16 backend modules owned by different teams, with reusable components, automated tests and consistency between UI and services.",
        tags: PROJECT_TAGS.inoa,
      },
      {
        name: "SaaS products — QualiCloud",
        description:
          "As partner and tech lead, I turned business needs into web and mobile SaaS products, from architecture to delivery, with NestJS, Laravel, React and React Native.",
        tags: PROJECT_TAGS.qualicloud,
      },
    ],
  },
  experience: {
    title: "Experience",
    items: [
      {
        role: "Senior Full Stack Software Engineer",
        company: EXPERIENCE.inoa.company,
        period: "Jan 2026 — Jul 2026",
        location: "Rio de Janeiro, Brazil · Remote",
        description:
          "Building and maintaining Inoa's platform, focused on an AngularJS frontend integrated with 16 backend modules owned by different teams.",
        highlights: [
          "New features, business flows and integrations with the APIs of all 16 backend modules.",
          "Built and maintained reusable components in AngularJS, TypeScript and React.",
          "Technical alignment with multiple backend teams.",
          "Code reviews, technical decisions and frontend architecture evolution.",
          "Automated tests with Jest and React Testing Library; components documented in Storybook.",
        ],
        technologies: EXPERIENCE.inoa.technologies,
      },
      {
        role: "Mid-level Full Stack Software Engineer",
        company: EXPERIENCE.pravalerPleno.company,
        period: "Jun 2023 — Nov 2025",
        location: "São Paulo, Brazil",
        description:
          "Modernizing Pravaler's digital ecosystem. From 2025, on the “Strategy for Action (EPA)” team, on a mission to rebuild the company's legacy system.",
        highlights: [
          "Rebuilt the critical simulation, pre-simulation, sign-up, credit and customer service flows.",
          "Interfaces and services with Node.js and Next.js, using Material UI, shadcn/ui and Tailwind CSS.",
          "Frontend-to-API integration and architecture evolution for scalability and maintainability.",
          "Applications running on Google Cloud Platform, gradually replacing legacy structures.",
          "Unit and integration tests with Jest to reduce regressions.",
        ],
        technologies: EXPERIENCE.pravalerPleno.technologies,
      },
      {
        role: "Junior Full Stack Software Engineer",
        company: EXPERIENCE.pravalerJunior.company,
        period: "Jul 2022 — Jul 2023",
        location: "Remote",
        description:
          "Acquisition and Discovery team, focused on customer acquisition, user experience, performance and SEO.",
        highlights: [
          "Migrated a 20+ year-old WordPress/PHP legacy to Next.js, Node.js and TypeScript (SPA, SSR and SSG).",
          "Helped create a new BFF architecture for the portal and marketplace, including microservice studies and integrations.",
          "400+ unit and integration tests with Jest, React Testing Library and Cypress.",
          "Moved applications to Google Cloud Platform, Docker and CI/CD.",
          "New portal/rebrand, TypeScript adoption and contributions to the Agile culture.",
        ],
        technologies: EXPERIENCE.pravalerJunior.technologies,
      },
      {
        role: "Full Stack Developer — Partner",
        company: EXPERIENCE.qualicloud.company,
        period: "Apr 2019 — Nov 2022",
        location: "Campo Mourão, Brazil",
        description:
          "Co-owner and tech lead of a SaaS company, responsible for the team and for products from concept to delivery.",
        highlights: [
          "Technical leadership: alignment meetings, task distribution and delivery follow-up.",
          "Turned business needs into viable technical solutions.",
          "Defined and evolved the architecture of web and mobile applications.",
          "APIs and integrations with Node.js, NestJS, PHP and Laravel; apps with React and React Native.",
        ],
        technologies: EXPERIENCE.qualicloud.technologies,
      },
      {
        role: "Systems Development Analyst",
        company: EXPERIENCE.cristofoli.company,
        period: "Jul 2017 — Jun 2022",
        location: "Campo Mourão, Brazil",
        description:
          "Developing and evolving corporate systems, from requirements gathering to implementation, maintenance and continuous improvement.",
        highlights: [
          "Web applications and internal systems with PHP, Laravel, JavaScript, jQuery and WordPress.",
          "System and database integrations, APIs, SQL queries and PL/SQL routines.",
          "Modernized legacy systems and removed bottlenecks in internal processes.",
          "Worked closely with business areas to turn requirements into features.",
        ],
        technologies: EXPERIENCE.cristofoli.technologies,
      },
    ],
  },
  contact: {
    title: "Contact",
    description: "Let's talk? These are the best ways to reach me.",
    links: contactLinks("Email"),
  },
  footer: {
    owner: "Douglas Szapak",
    links: [DESIGN_SYSTEM_LINK],
    rightsReserved: "All rights reserved.",
  },
};
