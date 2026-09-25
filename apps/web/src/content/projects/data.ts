import type { ProjectData, SnapshotKey } from "./types";

/**
 * Dados dos projetos que não dependem de idioma. A ordem aqui é a ordem na
 * página. Números: somente os documentados (experiência, "Sobre" e dados
 * fornecidos pelo Douglas) — nada estimado.
 */

const REPO = "https://github.com/douglasvsf/portfolio";

export const COMPANY_URLS = {
  pravaler: "https://www.pravaler.com.br/",
  inoa: "https://inoa.com/",
  qualicloud: "https://qualicloud.online/",
  cristofoli: "https://cristofoli.com/",
} as const;

export const PROJECT_DATA: ProjectData[] = [
  {
    id: "pravaler-discovery",
    category: "professional",
    discipline: "fullstack",
    company: "Pravaler",
    companyUrl: COMPANY_URLS.pravaler,
    period: "2022 — 2025",
    technologies: ["Next.js", "Node.js", "TypeScript", "BFF", "Jest", "Cypress"],
    metrics: [
      { key: "monthlyVisits", value: "400K+" },
      { key: "peakVisits", value: "650K" },
      { key: "linesOfCode", value: "200K+" },
      { key: "automatedTests", value: "400+" },
    ],
    hasCase: true,
  },
  {
    id: "pravaler-canais-epa",
    category: "professional",
    discipline: "fullstack",
    company: "Pravaler",
    companyUrl: COMPANY_URLS.pravaler,
    period: "2025",
    technologies: ["Next.js", "Node.js", "shadcn/ui", "Tailwind CSS", "Jest", "GCP"],
    metrics: [
      { key: "legacyYears", value: "20+" },
      { key: "stack", value: "Next.js + Node.js" },
      { key: "cloud", value: "GCP" },
    ],
    hasCase: true,
  },
  {
    id: "inoa",
    category: "professional",
    discipline: "frontend",
    company: "Inoa",
    companyUrl: COMPANY_URLS.inoa,
    period: "2026",
    technologies: ["AngularJS", "React", "TypeScript", "Storybook"],
    metrics: [
      { key: "backendModules", value: "16" },
      { key: "frontendStack", value: "AngularJS + React" },
    ],
    hasCase: true,
  },
  {
    id: "qualicloud",
    category: "professional",
    discipline: "fullstack",
    company: "QualiCloud",
    companyUrl: COMPANY_URLS.qualicloud,
    period: "2019 — 2022",
    technologies: ["NestJS", "Laravel", "React", "React Native"],
    metrics: [
      { key: "role", value: "Tech Lead" },
      { key: "platforms", value: "Web + Mobile" },
    ],
    hasCase: true,
  },
  {
    id: "kaiju-stocks",
    category: "personal",
    discipline: "fullstack",
    period: "2026",
    technologies: ["Next.js", "TypeScript", "Zod", "Recharts", "brapi", "CoinGecko"],
    metrics: [],
    liveUrl: "/stocks",
    codeUrl: `${REPO}/tree/main/apps/web/src/app/stocks`,
    hasCase: false,
  },
  {
    id: "spotify-stats",
    category: "personal",
    discipline: "fullstack",
    period: "2026",
    technologies: ["Next.js", "Spotify Web API", "OAuth PKCE", "Last.fm API", "Recharts"],
    metrics: [],
    liveUrl: "/spotify",
    codeUrl: `${REPO}/tree/main/apps/web/src/app/spotify`,
    hasCase: false,
  },
  {
    id: "godzilla-ui",
    category: "personal",
    discipline: "frontend",
    period: "2026",
    technologies: ["React", "Radix UI", "Tailwind CSS", "Storybook"],
    metrics: [],
    liveUrl: "/design-system",
    codeUrl: `${REPO}/tree/main/packages/ui`,
    hasCase: false,
  },
];

/**
 * "Engineering snapshot": números de destaque, cada um apontando para o case
 * de onde vem — derivados só do que está documentado acima e nos cases.
 */
export const SNAPSHOT: { key: SnapshotKey; value: string; projectId: string }[] = [
  { key: "legacyYears", value: "20+", projectId: "pravaler-discovery" },
  { key: "monthlyVisits", value: "400K+", projectId: "pravaler-discovery" },
  { key: "backendModules", value: "16", projectId: "inoa" },
  { key: "automatedTests", value: "400+", projectId: "pravaler-discovery" },
];
