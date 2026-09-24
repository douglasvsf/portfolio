/**
 * Retry com backoff exponencial + jitter para chamadas idempotentes (GET) a
 * APIs externas. Só repete falhas transitórias — quem decide é `retryable`.
 *
 * Nunca use em operações que não podem ser repetidas (ex.: trocar o código do
 * OAuth por token: o código vale uma vez só).
 */

export interface RetryDecision {
  retry: boolean;
  /** Espera sugerida pelo servidor (ex.: Retry-After), em ms. */
  afterMs?: number;
}

export interface RetryOptions {
  /** Tentativas extras além da primeira. @default 2 */
  retries?: number;
  /** Base do backoff: 300ms, 600ms, 1200ms… @default 300 */
  baseDelayMs?: number;
  /** Nenhuma espera passa disso — se o servidor pedir mais, desiste. @default 3000 */
  maxDelayMs?: number;
  retryable: (error: unknown) => RetryDecision;
}

/** Relógio injetável: os testes trocam por uma versão instantânea (ver jest.setup.ts). */
export const retryRuntime = {
  sleep: (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)),
  random: Math.random,
};

export function backoffDelay(attempt: number, baseDelayMs: number, maxDelayMs: number) {
  const exponential = baseDelayMs * 2 ** attempt;
  const jitter = retryRuntime.random() * baseDelayMs;
  return Math.min(exponential + jitter, maxDelayMs);
}

export async function withRetry<T>(task: (attempt: number) => Promise<T>, options: RetryOptions): Promise<T> {
  const { retries = 2, baseDelayMs = 300, maxDelayMs = 3000, retryable } = options;

  for (let attempt = 0; ; attempt++) {
    try {
      return await task(attempt);
    } catch (error) {
      const decision = retryable(error);
      if (!decision.retry || attempt >= retries) throw error;

      const delay = decision.afterMs ?? backoffDelay(attempt, baseDelayMs, maxDelayMs);
      // Servidor pediu para esperar mais do que aceitamos segurar a requisição do usuário.
      if (delay > maxDelayMs) throw error;
      await retryRuntime.sleep(delay);
    }
  }
}
