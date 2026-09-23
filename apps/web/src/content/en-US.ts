import type { SiteContent } from "./types";
import { PROJECT_TAGS, SECTION_IDS, SKILL_ITEMS, contactLinks, navLinks } from "./shared";

export const enUS: SiteContent = {
  meta: {
    title: "Godzilla — Full Stack Developer",
    description:
      "Personal portfolio of Douglas Vinicius Szapak Ferreira (Godzilla), full stack engineer. Projects, skills and experience.",
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
    paragraphs: [
      "My name is Douglas Vinicius Szapak Ferreira — also known in the industry as Godzilla. I'm a software engineer with 6+ years of experience across frontend and backend, including legacy system migrations, API development and cross-functional squads.",
      "I use AI tools (Code Assist and intelligent agents) every day to boost productivity and speed up how solutions get built.",
    ],
    facts: [
      { label: "Experience", value: "6+ years" },
      { label: "Focus", value: "Full Stack" },
      { label: "Main stack", value: "React & Node.js" },
      { label: "Education", value: "Systems Analysis — Cesumar" },
    ],
  },
  skills: {
    title: "Skills",
    description: "The technologies and practices I use day to day.",
    groups: [
      { category: "Frontend", items: SKILL_ITEMS.frontend },
      { category: "Backend", items: SKILL_ITEMS.backend },
      { category: "Data & Infrastructure", items: SKILL_ITEMS.data },
      { category: "Testing & Quality", items: SKILL_ITEMS.quality },
    ],
  },
  projects: {
    title: "Projects",
    description: "Initiatives I've led or been part of throughout my career.",
    items: [
      {
        name: "Discovery Ecosystem Modernization — Pravaler",
        description:
          "Led the migration of a 20+ year-old WordPress/PHP legacy system to Next.js and Node.js, fully rebuilding the simulation, sign-up and customer service flows, backed by 400+ automated tests.",
        tags: PROJECT_TAGS.pravaler,
      },
      {
        name: "Multi-Backend Integration — Inoa",
        description:
          "Built and maintained the frontend layer integrated with 16 distinct backend modules, using AngularJS, React and TypeScript, in continuous technical alignment across multiple teams.",
        tags: PROJECT_TAGS.inoa,
      },
      {
        name: "QualiCloud — In-house SaaS",
        description:
          "Co-founder and tech lead of a software house, turning business needs into full stack products with NestJS, Laravel and React Native alongside a development team.",
        tags: PROJECT_TAGS.qualicloud,
      },
    ],
  },
  experience: {
    title: "Experience",
    items: [
      {
        role: "Software Engineer",
        company: "Inoa — Capital Markets Specialists",
        period: "Jan 2026 — present",
        description:
          "Building and maintaining the platform's frontend (AngularJS, React and TypeScript), keeping integration consistent across 16 backend modules owned by different teams.",
      },
      {
        role: "Software Engineer",
        company: "Pravaler — Student Financing",
        period: "Jun 2022 — Nov 2025",
        description:
          "Led the migration of a WordPress/PHP legacy system to Next.js and Node.js, evolving 300k+ lines of code, adding 400+ automated tests and fully rebuilding the critical simulation, sign-up and customer service flows.",
      },
      {
        role: "Full Stack Developer / Partner",
        company: "QualiCloud Cloud Solutions",
        period: "Apr 2019 — Nov 2022",
        description:
          "Co-founder and tech lead of a development team, turning business needs into full stack SaaS products with NestJS, Laravel and React Native.",
      },
      {
        role: "Systems Development Analyst",
        company: "Cristófoli Equipamentos",
        period: "Jul 2015 — Nov 2022",
        description:
          "Built MVC applications and RESTful APIs (PHP, Laravel, Node.js) for an internal CRM used by around 160 people, integrated with the corporate ERP.",
      },
    ],
  },
  contact: {
    title: "Contact",
    description: "Let's talk? These are the best ways to reach me.",
    links: contactLinks("Email"),
  },
  footer: {
    owner: "Godzilla",
    rightsReserved: "All rights reserved.",
  },
};
