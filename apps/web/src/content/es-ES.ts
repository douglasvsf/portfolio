import type { SiteContent } from "./types";
import { DESIGN_SYSTEM_LINK, EXPERIENCE, PROFILE_PHOTO, PROJECT_TAGS, SECTION_IDS, SKILL_ITEMS, contactLinks, navLinks } from "./shared";

export const esES: SiteContent = {
  meta: {
    title: "Douglas Szapak — Ingeniero de Software Full Stack Sénior",
    description:
      "Douglas Szapak, ingeniero de software full stack sénior con más de 9 años en React, Next.js y Node.js. Conoce sus proyectos, experiencia y habilidades.",
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
    photo: { ...PROFILE_PHOTO, alt: "Foto de Douglas Szapak sonriendo al aire libre" },
    paragraphs: [
      "Me llamo Douglas Vinicius Szapak Ferreira — en el sector, también conocido como Godzilla. Soy ingeniero de software full stack sénior, con más de 9 años construyendo productos web desde el levantamiento de requisitos hasta producción.",
      "Empecé desarrollando sistemas corporativos, APIs e integraciones en Cristófoli. Después cofundé QualiCloud, donde fui socio y líder técnico de un equipo que creaba productos SaaS web y móviles. En Pravaler participé en la modernización de un ecosistema legado de más de 20 años — migrando WordPress/PHP a Next.js, Node.js y TypeScript, ayudando a crear una arquitectura BFF y escribiendo más de 400 pruebas automatizadas. En Inoa trabajé como sénior en el frontend de una plataforma integrada con 16 módulos de backend.",
      "Me gusta el código bien organizado y los equipos que crecen juntos: participo en code reviews, decisiones de arquitectura y creación de componentes reutilizables. En el día a día uso herramientas de IA (Code Assist y agentes) para ganar productividad sin renunciar a la calidad.",
    ],
    facts: [
      { label: "Experiencia", value: "9+ años" },
      { label: "Nivel", value: "Sénior" },
      { label: "Stack principal", value: "React · Next.js · Node.js" },
      { label: "Pruebas automatizadas", value: "400+" },
      { label: "Liderazgo", value: "Ex socio y tech lead" },
      { label: "Formación", value: "ADS — Cesumar" },
    ],
  },
  skills: {
    title: "Skills",
    description: "Tecnologías y prácticas que he usado en producción a lo largo de mi carrera.",
    groups: [
      { category: "Frontend", items: SKILL_ITEMS.frontend },
      { category: "Backend", items: SKILL_ITEMS.backend },
      { category: "Datos e Infraestructura", items: SKILL_ITEMS.data },
      { category: "Pruebas y Calidad", items: SKILL_ITEMS.quality },
      { category: "Arquitectura", items: SKILL_ITEMS.architecture },
    ],
  },
  projects: {
    title: "Proyectos",
    description: "Iniciativas de las que formé parte a lo largo de mi carrera.",
    items: [
      {
        name: "Reconstrucción del legado — Canales EPA · Pravaler",
        description:
          "En el equipo “Estrategia para la Acción”, reconstrucción del sistema legado de la empresa: simulación, presimulación, registro, crédito, atención, sitio web y formularios, con Next.js, Node.js, shadcn/ui y Tailwind CSS sobre Google Cloud Platform.",
        tags: PROJECT_TAGS.epa,
      },
      {
        name: "Modernización de Discovery — Pravaler",
        description:
          "Migración de un ecosistema WordPress/PHP de más de 20 años a Next.js, Node.js y TypeScript (SPA, SSR y SSG), con una nueva arquitectura BFF para el portal y el marketplace y más de 400 pruebas unitarias y de integración.",
        tags: PROJECT_TAGS.discovery,
      },
      {
        name: "Plataforma de mercado de capitales — Inoa",
        description:
          "Evolución del frontend en AngularJS, TypeScript y React integrado con 16 módulos de backend de equipos distintos, con componentes reutilizables, pruebas automatizadas y consistencia entre interfaz y servicios.",
        tags: PROJECT_TAGS.inoa,
      },
      {
        name: "Productos SaaS — QualiCloud",
        description:
          "Como socio y líder técnico, convertí necesidades de negocio en productos SaaS web y móviles, desde la arquitectura hasta la entrega, con NestJS, Laravel, React y React Native.",
        tags: PROJECT_TAGS.qualicloud,
      },
    ],
  },
  experience: {
    title: "Experiencia",
    items: [
      {
        role: "Ingeniero de Software Full Stack Sénior",
        company: EXPERIENCE.inoa.company,
        period: "ene 2026 — jul 2026",
        location: "Río de Janeiro, Brasil · Remoto",
        description:
          "Desarrollo y mantenimiento de la plataforma de Inoa, con foco en el frontend en AngularJS integrado con 16 módulos de backend mantenidos por distintos equipos.",
        highlights: [
          "Nuevas funcionalidades, flujos de negocio e integraciones con las APIs de los 16 módulos de backend.",
          "Creación y mantenimiento de componentes reutilizables en AngularJS, TypeScript y React.",
          "Alineación técnica con varios equipos de backend.",
          "Code reviews, decisiones técnicas y evolución de la arquitectura frontend.",
          "Pruebas automatizadas con Jest y React Testing Library; componentes documentados en Storybook.",
        ],
        technologies: EXPERIENCE.inoa.technologies,
      },
      {
        role: "Ingeniero de Software Full Stack Semi Sénior",
        company: EXPERIENCE.pravalerPleno.company,
        period: "jun 2023 — nov 2025",
        location: "São Paulo, Brasil",
        description:
          "Modernización del ecosistema digital de Pravaler. Desde 2025, en el equipo “Estrategia para la Acción (EPA)”, con la misión de reconstruir el sistema legado de la empresa.",
        highlights: [
          "Reconstrucción de los flujos críticos de simulación, presimulación, registro, crédito y atención.",
          "Interfaces y servicios con Node.js y Next.js, usando Material UI, shadcn/ui y Tailwind CSS.",
          "Integración entre frontend y APIs y evolución de la arquitectura para escalar con facilidad de mantenimiento.",
          "Aplicaciones en Google Cloud Platform, sustituyendo gradualmente las estructuras legadas.",
          "Pruebas unitarias y de integración con Jest para reducir regresiones.",
        ],
        technologies: EXPERIENCE.pravalerPleno.technologies,
      },
      {
        role: "Ingeniero de Software Full Stack Júnior",
        company: EXPERIENCE.pravalerJunior.company,
        period: "jul 2022 — jul 2023",
        location: "Remoto",
        description:
          "Equipo de Adquisición y Discovery, con foco en captación de clientes, experiencia de usuario, rendimiento y SEO.",
        highlights: [
          "Migración de un legado WordPress/PHP de más de 20 años a Next.js, Node.js y TypeScript (SPA, SSR y SSG).",
          "Creación de una nueva arquitectura BFF para el portal y el marketplace, con estudios de microservicios e integraciones.",
          "Más de 400 pruebas unitarias y de integración con Jest, React Testing Library y Cypress.",
          "Migración de aplicaciones a Google Cloud Platform, Docker y CI/CD.",
          "Nuevo portal/rebrand, adopción de TypeScript y contribuciones a la cultura Agile.",
        ],
        technologies: EXPERIENCE.pravalerJunior.technologies,
      },
      {
        role: "Desarrollador Full Stack — Socio",
        company: EXPERIENCE.qualicloud.company,
        period: "abr 2019 — nov 2022",
        location: "Campo Mourão, Brasil",
        description:
          "Socio propietario y líder técnico de una empresa de soluciones SaaS, responsable del equipo y de los productos desde la concepción hasta la entrega.",
        highlights: [
          "Liderazgo técnico: alineaciones, reparto de tareas y seguimiento de entregas.",
          "Traducción de necesidades de negocio en soluciones técnicas viables.",
          "Definición y evolución de la arquitectura de las aplicaciones web y móviles.",
          "APIs e integraciones con Node.js, NestJS, PHP y Laravel; apps con React y React Native.",
        ],
        technologies: EXPERIENCE.qualicloud.technologies,
      },
      {
        role: "Analista de Desarrollo de Sistemas",
        company: EXPERIENCE.cristofoli.company,
        period: "jul 2017 — jun 2022",
        location: "Campo Mourão, Brasil",
        description:
          "Desarrollo y evolución de sistemas corporativos, desde el levantamiento de requisitos hasta la implementación, el mantenimiento y la mejora continua.",
        highlights: [
          "Aplicaciones web y sistemas internos con PHP, Laravel, JavaScript, jQuery y WordPress.",
          "Integración entre sistemas y bases de datos, APIs, consultas SQL y rutinas en PL/SQL.",
          "Modernización de sistemas legados y eliminación de cuellos de botella en procesos internos.",
          "Trabajo cercano con las áreas de negocio para convertir requisitos en funcionalidades.",
        ],
        technologies: EXPERIENCE.cristofoli.technologies,
      },
    ],
  },
  contact: {
    title: "Contacto",
    description: "¿Hablamos? Estos son los mejores canales para encontrarme.",
    links: contactLinks("Correo"),
  },
  footer: {
    owner: "Douglas Szapak",
    links: [DESIGN_SYSTEM_LINK],
    rightsReserved: "Todos los derechos reservados.",
  },
};
