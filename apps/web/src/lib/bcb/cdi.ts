import "server-only";
import { z } from "zod";
import { ContractError, parseContract, resilientArray } from "@/lib/http/contract";
import { withRetry } from "@/lib/http/retry";

/**
 * CDI diário do Banco Central (SGS, série 12) — API pública, sem chave.
 * https://dadosabertos.bcb.gov.br/dataset/12-taxa-de-juros---cdi
 *
 * Serve de referência para comparar a carteira. Se o BCB falhar, a tela só
 * esconde a comparação: `null`, nunca erro.
 */

const SERIES_URL = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.12/dados";
const TIMEOUT_MS = 8000;
const REVALIDATE_SECONDS = 60 * 60 * 12; // taxa sai uma vez por dia útil
/** O SGS limita consultas diárias a 10 anos. */
const MAX_YEARS = 10;

const cdiSchema = z.object({
  data: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/),
  /** % ao dia, com ponto decimal: "0.050788". */
  valor: z.coerce.number().finite().nonnegative(),
});

const seriesSchema = resilientArray(cdiSchema, "bcb sgs 12");

export interface CdiPeriod {
  /** Primeiro dia útil considerado (aaaa-mm-dd). */
  from: string;
  to: string;
  /** CDI acumulado no período, em %. */
  percent: number;
  days: number;
}

class BcbError extends Error {
  constructor(readonly transient: boolean, message: string) {
    super(message);
  }
}

/** Composição dos fatores diários: Π(1 + taxa/100) − 1. */
export function accumulate(rates: readonly number[]) {
  return (rates.reduce((factor, rate) => factor * (1 + rate / 100), 1) - 1) * 100;
}

const toBr = (iso: string) => iso.split("-").reverse().join("/");
const toIso = (br: string) => br.split("/").reverse().join("-");

export async function getCdiSince(fromIso: string, today = new Date()): Promise<CdiPeriod | null> {
  const to = today.toISOString().slice(0, 10);
  const oldest = new Date(today);
  oldest.setUTCFullYear(oldest.getUTCFullYear() - MAX_YEARS);
  const from = fromIso < oldest.toISOString().slice(0, 10) ? oldest.toISOString().slice(0, 10) : fromIso;
  if (from >= to) return null;

  const url = `${SERIES_URL}?formato=json&dataInicial=${toBr(from)}&dataFinal=${toBr(to)}`;
  try {
    const body = await withRetry(
      async () => {
        let response: Response;
        try {
          response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS), next: { revalidate: REVALIDATE_SECONDS } });
        } catch {
          throw new BcbError(true, "Falha de rede no BCB");
        }
        if (!response.ok) throw new BcbError(response.status >= 500 || response.status === 429, `BCB respondeu ${response.status}`);
        return response.json().catch(() => {
          throw new BcbError(false, "JSON inválido do BCB");
        });
      },
      { retryable: (error) => ({ retry: error instanceof BcbError && error.transient }) },
    );
    const series = parseContract(seriesSchema, body, "bcb sgs 12");
    if (series.length === 0) return null;
    return {
      from: toIso(series[0].data),
      to: toIso(series[series.length - 1].data),
      percent: accumulate(series.map((day) => day.valor)),
      days: series.length,
    };
  } catch (error) {
    if (error instanceof BcbError || error instanceof ContractError) return null;
    throw error;
  }
}
