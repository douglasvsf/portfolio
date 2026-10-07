import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { pay } from "@portfolio/shared";
import { notFound } from "../erp/common/errors";
import { PayDatabase, type Queryable } from "./db";
import type { MerchantRow } from "./merchants";
import { safePost, type PostResult } from "./safe-http";
import { SIGNATURE_HEADER, signPayload, verifySignature } from "./signature";

/**
 * Webhooks com entrega garantida "pelo menos uma vez":
 *
 * 1. O evento entra na fila (pay_webhook_deliveries) na MESMA transação que
 *    muda a cobrança (padrão outbox): se a cobrança foi paga, o evento existe.
 * 2. Um trabalhador pega as entregas vencidas com FOR UPDATE SKIP LOCKED —
 *    vários trabalhadores ao mesmo tempo nunca pegam a mesma — e as "aluga"
 *    por um minuto empurrando next_attempt_at.
 * 3. Falhou? Nova tentativa com espera crescente; esgotou, vira "failed" e
 *    pode ser reenviada à mão.
 *
 * O destino padrão é o inspetor da própria loja (guarda o que recebeu e
 * confere a assinatura como um servidor de verdade faria); com URL própria, o
 * envio é HTTPS com proteção contra SSRF.
 */

/** Espera antes de cada nova tentativa: 30 s, 2 min, 10 min, 1 h, 6 h. Seis tentativas no total. */
export const RETRY_DELAYS_SECONDS = [30, 120, 600, 3600, 21_600];
export const MAX_ATTEMPTS = RETRY_DELAYS_SECONDS.length + 1;
const LEASE_SECONDS = 60;

interface DeliveryRow {
  id: string;
  merchant_id: string;
  event_id: string;
  event_type: pay.WebhookEvent;
  charge_id: string | null;
  payload: unknown;
  url: string | null;
  status: pay.DeliveryStatus;
  attempts: number;
  next_attempt_at: Date | null;
  last_status_code: number | null;
  last_error: string | null;
  delivered_at: Date | null;
  created_at: Date;
}

const iso = (date: Date | null) => (date ? date.toISOString() : null);

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger("PayWebhooks");

  constructor(private readonly db: PayDatabase) {}

  /** Grava o evento na fila, dentro da transação de quem chamou (outbox). */
  async enqueue(client: Queryable, merchant: Pick<MerchantRow, "id" | "webhook_url">, type: pay.WebhookEvent, charge: pay.Charge, extra: Record<string, unknown> = {}) {
    const eventId = randomUUID();
    const payload = { id: eventId, type, createdAt: new Date().toISOString(), data: { charge, ...extra } };
    await client.query(
      `insert into pay_webhook_deliveries (merchant_id, event_id, event_type, charge_id, payload, url)
       values ($1, $2, $3, $4, $5, $6)`,
      [merchant.id, eventId, type, charge.id, JSON.stringify(payload), merchant.webhook_url],
    );
  }

  /** Processa as entregas vencidas (de uma loja ou de todas). Devolve quantas tentou. */
  async processDue(options: { merchantId?: string; limit?: number } = {}): Promise<number> {
    const { rows } = await this.db.query<DeliveryRow>(
      `with due as (
         select id from pay_webhook_deliveries
         where status = 'pending' and next_attempt_at <= now() and ($1::uuid is null or merchant_id = $1)
         order by next_attempt_at
         limit $2
         for no key update skip locked
       )
       update pay_webhook_deliveries d set next_attempt_at = now() + make_interval(secs => $3)
       from due where d.id = due.id
       returning d.*`,
      [options.merchantId ?? null, options.limit ?? 20, LEASE_SECONDS],
    );
    for (const delivery of rows) await this.attempt(delivery);
    return rows.length;
  }

  /** Reenvio manual: tenta agora, mesmo que as tentativas automáticas tenham acabado. */
  async retry(merchant: MerchantRow, deliveryId: string): Promise<pay.WebhookDelivery> {
    const { rows } = await this.db.query<DeliveryRow>(
      `update pay_webhook_deliveries set next_attempt_at = now() + make_interval(secs => $3)
       where id = $1 and merchant_id = $2 returning *`,
      [deliveryId, merchant.id, LEASE_SECONDS],
    );
    if (!rows[0]) throw notFound("Entrega");
    await this.attempt(rows[0], { manual: true });
    return this.get(merchant, deliveryId);
  }

  private async attempt(delivery: DeliveryRow, { manual = false } = {}) {
    const body = JSON.stringify(delivery.payload);
    const { rows } = await this.db.query<{ webhook_secret: string }>("select webhook_secret from pay_merchants where id = $1", [delivery.merchant_id]);
    if (!rows[0]) return; // a loja expirou e sumiu no meio do caminho
    const headers = {
      "content-type": "application/json",
      "user-agent": "GODZILLA-Pay-Webhooks/1.0",
      "godzilla-event": delivery.event_type,
      "godzilla-delivery": delivery.id,
      [SIGNATURE_HEADER]: signPayload(rows[0].webhook_secret, body),
    };

    let result: PostResult;
    try {
      result = delivery.url ? await safePost(delivery.url, body, headers) : await this.inspector(delivery, headers, body, rows[0].webhook_secret);
    } catch (error) {
      result = { statusCode: null, error: error instanceof Error ? error.message : String(error), durationMs: 0 };
    }

    const ok = result.statusCode !== null && result.statusCode >= 200 && result.statusCode < 300;
    const attempts = delivery.attempts + 1;
    const exhausted = attempts >= MAX_ATTEMPTS;
    const status: pay.DeliveryStatus = ok ? "delivered" : exhausted || (manual && delivery.status === "failed") ? "failed" : "pending";
    const delay = RETRY_DELAYS_SECONDS[Math.min(attempts - 1, RETRY_DELAYS_SECONDS.length - 1)]!;
    const error = ok ? null : (result.error ?? `o destino respondeu HTTP ${result.statusCode}`);

    await this.db.query(
      `with attempt as (
         insert into pay_webhook_attempts (delivery_id, status_code, error, duration_ms) values ($1, $2, $3, $4)
       )
       update pay_webhook_deliveries set
         attempts = $5, status = $6, last_status_code = $2, last_error = $3,
         delivered_at = case when $6 = 'delivered' then now() else delivered_at end,
         next_attempt_at = case when $6 = 'pending' then now() + make_interval(secs => $7) else null end
       where id = $1`,
      [delivery.id, result.statusCode, error, result.durationMs, attempts, status, delay],
    );
    if (!ok) this.logger.debug(`entrega ${delivery.id} falhou (${attempts}/${MAX_ATTEMPTS}): ${error}`);
  }

  /**
   * Inspetor da loja: recebe como um servidor de verdade — confere a
   * assinatura com o segredo e responde. Se configurado, recusa as próximas
   * entregas com HTTP 500 para mostrar as novas tentativas acontecendo.
   */
  private async inspector(delivery: DeliveryRow, headers: Record<string, string>, body: string, secret: string): Promise<PostResult> {
    const started = Date.now();
    // Atômico: duas entregas ao mesmo tempo nunca consomem a mesma "falha programada".
    const forced = await this.db.query(
      "update pay_merchants set inspector_fail_next = inspector_fail_next - 1 where id = $1 and inspector_fail_next > 0",
      [delivery.merchant_id],
    );
    const statusCode = forced.rowCount ? 500 : 200;
    await this.db.query(
      `insert into pay_inspector_requests (merchant_id, event_type, headers, body, signature_valid, responded_status)
       values ($1, $2, $3, $4, $5, $6)`,
      [delivery.merchant_id, delivery.event_type, JSON.stringify(headers), body, verifySignature(secret, body, headers[SIGNATURE_HEADER]), statusCode],
    );
    return { statusCode, error: null, durationMs: Date.now() - started };
  }

  async list(merchant: MerchantRow, limit = 50): Promise<pay.WebhookDelivery[]> {
    const { rows } = await this.db.query<DeliveryRow & { history: pay.WebhookDelivery["history"] }>(
      `select d.*, coalesce(
         (select json_agg(json_build_object('at', a.attempted_at, 'statusCode', a.status_code, 'error', a.error, 'durationMs', a.duration_ms) order by a.attempted_at)
          from pay_webhook_attempts a where a.delivery_id = d.id), '[]') as history
       from pay_webhook_deliveries d where d.merchant_id = $1
       order by d.created_at desc limit $2`,
      [merchant.id, limit],
    );
    return rows.map(toDelivery);
  }

  async get(merchant: MerchantRow, id: string): Promise<pay.WebhookDelivery> {
    const found = (await this.list(merchant, 500)).find((delivery) => delivery.id === id);
    if (!found) throw notFound("Entrega");
    return found;
  }

  async inspectorRequests(merchant: MerchantRow, limit = 50): Promise<pay.InspectorRequest[]> {
    const { rows } = await this.db.query<{
      id: number;
      received_at: Date;
      event_type: string;
      headers: Record<string, string>;
      body: string;
      signature_valid: boolean;
      responded_status: number;
    }>("select * from pay_inspector_requests where merchant_id = $1 order by received_at desc, id desc limit $2", [merchant.id, limit]);
    return rows.map((row) => ({
      id: String(row.id),
      receivedAt: row.received_at.toISOString(),
      eventType: row.event_type,
      headers: row.headers,
      body: row.body,
      signatureValid: row.signature_valid,
      respondedStatus: row.responded_status,
    }));
  }
}

function toDelivery(row: DeliveryRow & { history: pay.WebhookDelivery["history"] }): pay.WebhookDelivery {
  return {
    id: row.id,
    eventId: row.event_id,
    eventType: row.event_type,
    chargeId: row.charge_id,
    url: row.url ?? "inspetor da loja",
    status: row.status,
    attempts: row.attempts,
    nextAttemptAt: iso(row.next_attempt_at),
    lastStatusCode: row.last_status_code,
    lastError: row.last_error,
    deliveredAt: iso(row.delivered_at),
    createdAt: row.created_at.toISOString(),
    payload: row.payload,
    history: row.history.map((entry) => ({ ...entry, at: new Date(entry.at).toISOString() })),
  };
}
