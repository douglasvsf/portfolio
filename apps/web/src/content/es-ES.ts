import type { SiteContent } from "./types";
import { PROJECT_TAGS, SECTION_IDS, SKILL_ITEMS, contactLinks, navLinks } from "./shared";

export const esES: SiteContent = {
  meta: {
    title: "Godzilla — Full Stack Developer",
    description:
      "Portafolio personal de Douglas Vinicius Szapak Ferreira (Godzilla), ingeniero full stack. Proyectos, habilidades y experiencia.",
  },
  nav: {
    brand: "GODZILLA.DEV",
    skipToContent: "Saltar al contenido",
    links: navLinks({
      about: "Sobre mí",
      skills: "Skills",
      projects: "Proyectos",
      experience: "Experiencia",
      contact: "Contacto",
    }),
  },
  hero: {
    prompt: "$ whoami",
    title: "GODZILLA",
    subtitle: "Full Stack Developer",
    description:
      "Portafolio personal construido con un stack moderno, que muestra proyectos, experiencia y mi forma de trabajar. En constante evolución — como un kaiju que nunca deja de crecer.",
    primaryCta: { label: "Ver proyectos", href: `#${SECTION_IDS.projects}` },
    secondaryCta: { label: "Sobre mí", href: `#${SECTION_IDS.about}` },
  },
  about: {
    title: "Sobre mí",
    paragraphs: [
      "Me llamo Douglas Vinicius Szapak Ferreira — en el sector, también conocido como Godzilla. Ingeniero de software con más de 6 años de experiencia entre frontend y backend, con migraciones de sistemas legados, desarrollo de APIs y squads multidisciplinarios.",
      "Uso herramientas de IA (Code Assist y agentes inteligentes) en el día a día para aumentar la productividad y acelerar el desarrollo de soluciones.",
    ],
    facts: [
      { label: "Experiencia", value: "6+ años" },
      { label: "Enfoque", value: "Full Stack" },
      { label: "Stack principal", value: "React & Node.js" },
      { label: "Formación", value: "ADS — Cesumar" },
    ],
  },
  skills: {
    title: "Skills",
    description: "Tecnologías y prácticas que utilizo en el día a día.",
    groups: [
      { category: "Frontend", items: SKILL_ITEMS.frontend },
      { category: "Backend", items: SKILL_ITEMS.backend },
      { category: "Datos e Infraestructura", items: SKILL_ITEMS.data },
      { category: "Pruebas y Calidad", items: SKILL_ITEMS.quality },
    ],
  },
  projects: {
    title: "Proyectos",
    description: "Iniciativas que lideré o de las que formé parte a lo largo de mi carrera.",
    items: [
      {
        name: "Modernización del Ecosistema Discovery — Pravaler",
        description:
          "Lideré la migración de un sistema legado WordPress/PHP de más de 20 años a Next.js y Node.js, con la reconstrucción completa de los flujos de simulación, registro y atención, respaldada por más de 400 pruebas automatizadas.",
        tags: PROJECT_TAGS.pravaler,
      },
      {
        name: "Integración Multi-Backend — Inoa",
        description:
          "Desarrollo y mantenimiento de la capa frontend integrada con 16 módulos de backend distintos, con AngularJS, React y TypeScript, en alineación técnica continua entre varios equipos.",
        tags: PROJECT_TAGS.inoa,
      },
      {
        name: "QualiCloud — SaaS Propio",
        description:
          "Cofundador y líder técnico de una software house, convirtiendo necesidades de negocio en productos full stack con NestJS, Laravel y React Native junto a un equipo de desarrollo.",
        tags: PROJECT_TAGS.qualicloud,
      },
    ],
  },
  experience: {
    title: "Experiencia",
    items: [
      {
        role: "Ingeniero de Software",
        company: "Inoa — Especialistas en Mercado de Capitales",
        period: "Ene 2026 — actualidad",
        description:
          "Desarrollo y mantenimiento del frontend de la plataforma (AngularJS, React y TypeScript), con una integración consistente entre 16 módulos de backend mantenidos por equipos distintos.",
      },
      {
        role: "Ingeniero de Software",
        company: "Pravaler — Financiamiento Estudiantil",
        period: "Jun 2022 — Nov 2025",
        description:
          "Lideré la migración de un sistema legado WordPress/PHP a Next.js y Node.js, con más de 300 mil líneas de código evolucionadas, más de 400 pruebas automatizadas y la reconstrucción completa de los flujos críticos de simulación, registro y atención.",
      },
      {
        role: "Desarrollador Full Stack / Socio",
        company: "QualiCloud Cloud Solutions",
        period: "Abr 2019 — Nov 2022",
        description:
          "Cofundador y líder técnico de un equipo de desarrollo, convirtiendo necesidades de negocio en productos SaaS full stack con NestJS, Laravel y React Native.",
      },
      {
        role: "Analista de Desarrollo de Sistemas",
        company: "Cristófoli Equipamentos",
        period: "Jul 2015 — Nov 2022",
        description:
          "Desarrollo de aplicaciones MVC y APIs RESTful (PHP, Laravel, Node.js) para un CRM interno usado por unas 160 personas, integrado con el ERP corporativo.",
      },
    ],
  },
  contact: {
    title: "Contacto",
    description: "¿Hablamos? Estos son los mejores canales para encontrarme.",
    links: contactLinks("Correo"),
  },
  footer: {
    owner: "Godzilla",
    rightsReserved: "Todos los derechos reservados.",
  },
};
