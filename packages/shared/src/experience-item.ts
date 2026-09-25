export interface ExperienceItem {
  role: string;
  company: string;
  /** Site da empresa. */
  companyUrl?: string;
  period: string;
  description: string;
  /** Cidade/UF ou "Remoto". */
  location?: string;
  /** Principais atividades e resultados, um por item. */
  highlights?: string[];
  technologies?: string[];
}
