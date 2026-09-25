/**
 * Modelo dos projetos/cases do portfólio.
 *
 * Os dados se dividem em duas partes, como o resto do conteúdo do site:
 * - `ProjectData` (data.ts): o que não muda entre idiomas — empresa, site,
 *   período, stack, valores das métricas, links e ordem.
 * - `ProjectCopy` (pt-BR.ts, en-US.ts, es-ES.ts): os textos de cada idioma.
 *
 * `getProjects(locale)` junta os dois. Para adicionar um projeto, basta uma
 * entrada em data.ts e o texto nos três idiomas — os componentes não mudam.
 * Regra: só informação real. Sem métrica, sem card de métrica.
 */

export type ProjectCategory = "professional" | "personal";
export type ProjectDiscipline = "frontend" | "backend" | "fullstack";

/** Chaves das métricas: o valor fica em data.ts, o rótulo em cada idioma. */
export type MetricKey =
  | "legacyYears"
  | "stack"
  | "cloud"
  | "monthlyVisits"
  | "peakVisits"
  | "linesOfCode"
  | "automatedTests"
  | "backendModules"
  | "frontendStack"
  | "role"
  | "platforms";

export interface ProjectData {
  /** Também é o slug da página do case: /[lang]/projetos/{id}. */
  id: string;
  category: ProjectCategory;
  discipline: ProjectDiscipline;
  /** Empresa (profissionais). */
  company?: string;
  companyUrl?: string;
  /** Anos, sem mês — iguais em todos os idiomas. */
  period: string;
  /** No máximo ~6: o essencial, não a lista completa. */
  technologies: string[];
  metrics: { key: MetricKey; value: string }[];
  /** Produto no ar (pessoais) e código no GitHub. */
  liveUrl?: string;
  codeUrl?: string;
  /** Profissionais têm página de case. */
  hasCase: boolean;
}

export interface ArchitectureNode {
  label: string;
  detail?: string;
  /** Sistema substituído — aparece esmaecido no diagrama. */
  legacy?: boolean;
}

export interface TechnicalDecision {
  title: string;
  description: string;
}

export interface ProjectCaseCopy {
  context: string;
  challenge: string;
  role: string[];
  architecture: ArchitectureNode[];
  /** Só quando há resultado documentado. */
  result?: string;
  decisions: TechnicalDecision[];
}

export interface ProjectCopy {
  title: string;
  /** Uma ou duas frases para o card e a meta description. */
  summary: string;
  case?: ProjectCaseCopy;
}

export interface ProjectMetric {
  key: MetricKey;
  value: string;
  label: string;
}

export interface Project extends Omit<ProjectData, "metrics">, ProjectCopy {
  metrics: ProjectMetric[];
}

export interface SnapshotItem {
  value: string;
  label: string;
  /** Case de onde o número vem. */
  projectId: string;
}

/** Textos de um idioma: projetos, rótulos das métricas e do snapshot. */
export interface ProjectsCopy {
  projects: Record<string, ProjectCopy>;
  metrics: Record<MetricKey, string>;
  snapshot: Record<SnapshotKey, string>;
}

export type SnapshotKey = "legacyYears" | "monthlyVisits" | "backendModules" | "automatedTests";
