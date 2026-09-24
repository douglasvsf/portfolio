import { z } from "zod";

/**
 * Validação de contrato das APIs externas (Spotify, Last.fm, brapi).
 *
 * - Resposta que viola o essencial vira `ContractError` — nada de repassar
 *   dado malformado para a UI.
 * - Itens quebrados dentro de uma lista são descartados um a um
 *   (`resilientArray`): um artista malformado não derruba a página inteira.
 * - Toda divergência é reportada (hoje `console.warn`; é o ponto único para
 *   plugar Sentry/logs estruturados).
 */

export interface ContractIssue {
  source: string;
  message: string;
  /** Itens descartados de uma lista (quando aplicável). */
  dropped?: number;
}

export const contractReporter = {
  report(issue: ContractIssue) {
    console.warn(`[contract] ${issue.source}: ${issue.message}${issue.dropped ? ` (${issue.dropped} item(s) descartado(s))` : ""}`);
  },
};

export class ContractError extends Error {
  constructor(
    readonly source: string,
    readonly issues: string[],
  ) {
    super(`Resposta fora do contrato em ${source}: ${issues.join("; ")}`);
    this.name = "ContractError";
  }
}

/** "items.3.name: Invalid input: expected string, received number" */
export function formatIssues(error: z.ZodError, limit = 5) {
  return error.issues.slice(0, limit).map((issue) => `${issue.path.join(".") || "(raiz)"}: ${issue.message}`);
}

export function parseContract<Schema extends z.ZodType>(schema: Schema, data: unknown, source: string): z.output<Schema> {
  const result = schema.safeParse(data);
  if (result.success) return result.data;

  const issues = formatIssues(result.error);
  contractReporter.report({ source, message: issues.join("; ") });
  throw new ContractError(source, issues);
}

/**
 * Lista tolerante: valida item a item e descarta os inválidos, reportando
 * quantos saíram. Se o valor nem for uma lista, aí sim é quebra de contrato.
 */
export function resilientArray<Item extends z.ZodType>(item: Item, source: string) {
  return z.array(z.unknown()).transform((values) => {
    const valid: z.output<Item>[] = [];
    let firstIssue: string | undefined;
    for (const value of values) {
      const result = item.safeParse(value);
      if (result.success) valid.push(result.data);
      else firstIssue ??= formatIssues(result.error, 1)[0];
    }
    const dropped = values.length - valid.length;
    if (dropped > 0) contractReporter.report({ source, message: firstIssue ?? "item inválido", dropped });
    return valid;
  });
}
