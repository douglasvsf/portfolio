import type { ProjectsCopy } from "./types";

export const esES: ProjectsCopy = {
  metrics: {
    legacyYears: "años de legado",
    stack: "stack",
    cloud: "cloud",
    monthlyVisits: "visitas al mes",
    peakVisits: "pico de visitas",
    linesOfCode: "líneas de código",
    automatedTests: "tests automatizados",
    backendModules: "módulos de back-end integrados",
    frontendStack: "en el front-end",
    role: "y socio fundador",
    platforms: "productos SaaS",
  },
  snapshot: {
    legacyYears: "años de legado modernizado",
    monthlyVisits: "visitas al mes",
    backendModules: "módulos integrados",
    automatedTests: "tests automatizados",
  },
  projects: {
    "pravaler-discovery": {
      title: "Modernización del Discovery",
      summary:
        "Migración de un ecosistema WordPress/PHP de más de 20 años a Next.js, Node.js y TypeScript, con arquitectura BFF para el portal y el marketplace.",
      case: {
        context:
          "En el equipo de Adquisición y Discovery de Pravaler, el foco era la captación de clientes, la experiencia de usuario, el rendimiento y el SEO. El portal y el marketplace funcionaban sobre un ecosistema WordPress/PHP de más de 20 años.",
        challenge:
          "Sustituir ese legado por una arquitectura moderna en un canal con más de 400 mil visitas al mes (y picos de 650 mil), sin perder de vista el rendimiento, el SEO y la experiencia de usuario.",
        role: [
          "Migración del legado WordPress/PHP a Next.js, Node.js y TypeScript, con páginas en SPA, SSR y SSG.",
          "Creación de la nueva arquitectura BFF para el portal y el marketplace, con estudios de microservicios e integraciones.",
          "Más de 400 tests unitarios y de integración con Jest, React Testing Library y Cypress.",
          "Migración de aplicaciones a Google Cloud Platform, Docker y CI/CD.",
          "Participación en el nuevo portal/rebrand y en la adopción de TypeScript por el equipo.",
        ],
        architecture: [
          { label: "WordPress/PHP", detail: "legado de 20+ años", legacy: true },
          { label: "Next.js + React", detail: "SPA · SSR · SSG" },
          { label: "BFF en Node.js", detail: "portal y marketplace" },
          { label: "Servicios y APIs", detail: "integraciones" },
          { label: "Google Cloud Platform", detail: "Docker · CI/CD" },
        ],
        result: "Portal y marketplace migrados a Next.js, Node.js y TypeScript, sobre la nueva arquitectura BFF y con nuevo portal/rebrand.",
        decisions: [
          {
            title: "Un BFF entre las pantallas y los servicios",
            description: "Una capa en Node.js concentra las integraciones y entrega al portal y al marketplace los datos en el formato que cada pantalla necesita.",
          },
          {
            title: "Renderizado elegido por página",
            description: "SPA, SSR y SSG conviven en la misma base: cada página usa la estrategia que atiende al foco del equipo en rendimiento y SEO.",
          },
          {
            title: "Tests en capas",
            description: "Jest y React Testing Library para unidades e integraciones, Cypress para los flujos en el navegador — más de 400 tests en total.",
          },
          {
            title: "Infraestructura en contenedores",
            description: "Aplicaciones migradas a Google Cloud Platform con Docker y pipelines de CI/CD.",
          },
        ],
      },
    },
    "pravaler-canais-epa": {
      title: "Reconstrucción del legado — Canales EPA",
      summary:
        "En el equipo “Estrategia para la Acción”, reconstrucción del sistema legado: simulación, presimulación, registro, crédito, atención, sitio web y formularios.",
      case: {
        context:
          "En 2025, en el equipo “Estrategia para la Acción” (EPA) de Pravaler, la misión era reconstruir el sistema legado de la empresa — los canales de simulación, presimulación, registro, crédito, atención, sitio web y formularios.",
        challenge:
          "Reconstruir flujos críticos del negocio que dependían de un legado de más de 20 años, con una arquitectura que escalara y siguiera siendo fácil de mantener.",
        role: [
          "Reconstrucción de los flujos de simulación, presimulación, registro, crédito y atención.",
          "Interfaces y servicios con Next.js y Node.js, usando shadcn/ui, Tailwind CSS y Material UI.",
          "Integración entre front-end y APIs y evolución de la arquitectura.",
          "Aplicaciones en Google Cloud Platform, sustituyendo gradualmente las estructuras legadas.",
          "Tests unitarios y de integración con Jest para reducir regresiones.",
        ],
        architecture: [
          { label: "Sistema legado", detail: "20+ años", legacy: true },
          { label: "Canales EPA", detail: "simulación · registro · crédito · atención" },
          { label: "Next.js + shadcn/ui", detail: "interfaces con Tailwind CSS" },
          { label: "Node.js", detail: "servicios e integración con APIs" },
          { label: "Google Cloud Platform" },
        ],
        result: "Flujos críticos reconstruidos funcionando en Google Cloud Platform, sustituyendo gradualmente las estructuras legadas.",
        decisions: [
          {
            title: "Sustitución gradual",
            description: "En lugar de un cambio único, las nuevas aplicaciones fueron ocupando el lugar del legado poco a poco, flujo a flujo.",
          },
          {
            title: "Interfaz estandarizada",
            description: "shadcn/ui y Tailwind CSS como base visual para mantener la coherencia entre los canales reconstruidos.",
          },
          {
            title: "Tests contra regresiones",
            description: "Tests unitarios y de integración con Jest acompañando la reconstrucción de los flujos críticos.",
          },
        ],
      },
    },
    inoa: {
      title: "Plataforma de mercado de capitales",
      summary: "Front-end en AngularJS, TypeScript y React integrado con 16 módulos de back-end desarrollados por equipos diferentes.",
      case: {
        context:
          "En Inoa trabajé como ingeniero sénior en el front-end de una plataforma de mercado de capitales integrada con 16 módulos de back-end mantenidos por equipos diferentes.",
        challenge: "Evolucionar un front-end en AngularJS que se comunica con 16 servicios de equipos distintos, manteniendo la coherencia entre interfaz y servicios.",
        role: [
          "Nuevas funcionalidades, flujos de negocio e integraciones con las APIs de los 16 módulos de back-end.",
          "Creación y mantenimiento de componentes reutilizables en AngularJS, TypeScript y React.",
          "Alineación técnica con múltiples equipos de back-end.",
          "Code reviews, decisiones técnicas y evolución de la arquitectura front-end.",
          "Tests automatizados con Jest y React Testing Library; componentes documentados en Storybook.",
        ],
        architecture: [
          { label: "Front-end", detail: "AngularJS + React · TypeScript" },
          { label: "Componentes reutilizables", detail: "documentados en Storybook" },
          { label: "Integraciones con APIs", detail: "flujos de negocio" },
          { label: "16 módulos de back-end", detail: "equipos diferentes" },
        ],
        decisions: [
          {
            title: "Componentes reutilizables y documentados",
            description: "Componentes en AngularJS, TypeScript y React documentados en Storybook, para reutilizarlos y mantener la interfaz coherente.",
          },
          {
            title: "Alineación entre equipos",
            description: "Integrar 16 módulos exige una alineación técnica constante con los equipos de back-end sobre contratos y flujos.",
          },
          {
            title: "Tests automatizados",
            description: "Jest y React Testing Library cubriendo componentes y flujos del front-end.",
          },
        ],
      },
    },
    qualicloud: {
      title: "Productos SaaS",
      summary: "Como socio y líder técnico, transformé necesidades de negocio en productos SaaS web y móviles, de la arquitectura a la entrega.",
      case: {
        context: "Cofundé QualiCloud, empresa de soluciones SaaS, donde fui socio y líder técnico del equipo que creaba productos web y móviles.",
        challenge: "Transformar necesidades de negocio en soluciones técnicas viables y llevar los productos de la concepción a la entrega.",
        role: [
          "Liderazgo técnico: alineaciones, distribución de tareas y seguimiento de las entregas.",
          "Traducción de necesidades de negocio en soluciones técnicas viables.",
          "Definición y evolución de la arquitectura de las aplicaciones web y móviles.",
          "APIs e integraciones con Node.js, NestJS, PHP y Laravel; apps con React y React Native.",
        ],
        architecture: [
          { label: "Necesidades de negocio" },
          { label: "Arquitectura y stack", detail: "definición técnica" },
          { label: "APIs e integraciones", detail: "Node.js · NestJS · PHP · Laravel" },
          { label: "Productos SaaS", detail: "web (React) · móvil (React Native)" },
        ],
        decisions: [
          {
            title: "Liderazgo técnico cerca del negocio",
            description: "Alineaciones, distribución de tareas y seguimiento de las entregas, traduciendo necesidades de negocio en soluciones técnicas.",
          },
          {
            title: "React en web y móvil",
            description: "React en las aplicaciones web y React Native en móvil, con APIs en NestJS y Laravel.",
          },
        ],
      },
    },
    "kaiju-stocks": {
      title: "Kaiju Stocks",
      summary:
        "Cotizaciones de la B3 y cripto, historial con gráficos y una cartera con precio medio, dividendos, comparación con el CDI e importación de la hoja de la B3.",
    },
    "spotify-stats": {
      title: "GODZILLA Spotify Stats",
      summary: "Estadísticas musicales con OAuth de Spotify, Last.fm y vitrina en vivo: top artistas, canciones, géneros y lo que suena ahora.",
    },
    "godzilla-ui": {
      title: "GODZILLA UI",
      summary: "El Design System detrás de todos los sistemas: tokens, componentes accesibles, i18n y documentación en Storybook.",
    },
  },
};
