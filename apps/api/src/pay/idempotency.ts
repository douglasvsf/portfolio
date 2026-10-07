import { HttpStatus } from "@nestjs/common";
import { createHash } from "node:crypto";
import type { PoolClient } from "pg";
import { ErpException } from "../erp/common/errors";

/**
 * Idempotência dentro da MESMA transação do trabalho: a primeira requisição
 * insere a chave e segura a linha até o COMMIT; uma segunda com a mesma chave,
 * ao mesmo tempo, espera no INSERT e, quando a primeira termina, encontra a
 * resposta gravada e a devolve igual. Se a primeira falhar, o ROLLBACK leva a
 * chave junto e a repetição executa de verdade.
 */

export const requestHash = (body: unknown) => createHash("sha256").update(JSON.stringify(body)).digest("hex");

export interface IdempotentResult<T> {
  statusCode: number;
  body: T;
  replayed: boolean;
}

export async function idempotent<T>(
  client: PoolClient,
  merchantId: string,
  key: string,
  hash: string,
  work: () => Promise<{ statusCode: number; body: T }>,
): Promise<IdempotentResult<T>> {
  // Marcador: a linha fica com a reserva até a resposta real ser gravada, no fim desta mesma transação.
  const claimed = await client.query(
    `insert into pay_idempotency_keys (merchant_id, key, request_hash, status_code, response)
     values ($1, $2, $3, 0, 'null'::jsonb) on conflict do nothing`,
    [merchantId, key, hash],
  );
  if (claimed.rowCount === 0) {
    const { rows } = await client.query<{ request_hash: string; status_code: number; response: T }>(
      "select request_hash, status_code, response from pay_idempotency_keys where merchant_id = $1 and key = $2",
      [merchantId, key],
    );
    const stored = rows[0]!;
    if (stored.request_hash !== hash) {
      throw new ErpException("conflict", "Esta Idempotency-Key já foi usada com outro conteúdo", HttpStatus.UNPROCESSABLE_ENTITY);
    }
    return { statusCode: stored.status_code, body: stored.response, replayed: true };
  }

  const result = await work();
  await client.query("update pay_idempotency_keys set status_code = $3, response = $4 where merchant_id = $1 and key = $2", [
    merchantId,
    key,
    result.statusCode,
    JSON.stringify(result.body),
  ]);
  return { ...result, replayed: false };
}
