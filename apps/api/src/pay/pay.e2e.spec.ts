import type { INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { Test } from "@nestjs/testing";
import { ThrottlerModule } from "@nestjs/throttler";
import { Client } from "pg";
import request from "supertest";
import type { pay } from "@portfolio/shared";
import { configureApp } from "../app.factory";
import { ClientIpThrottlerGuard } from "../erp/common/throttler";
import { parseBrCode } from "./brcode";
import { PayModule } from "./pay.module";
import { verifySignature } from "./signature";

/**
 * GODZILLA Pay de ponta a ponta contra um PostgreSQL de verdade (binário
 * embutido, ver test/pg-setup.mjs): idempotência, livro-caixa, concorrência,
 * webhooks com novas tentativas e as regras que o próprio banco garante.
 */
jest.setTimeout(120_000);

let app: INestApplication;
let sql: Client;
let ipCounter = 0;

const server = () => app.getHttpServer();
const CRON_SECRET = "segredo-do-agendador-de-teste";

async function sandbox(): Promise<pay.Sandbox> {
  const response = await request(server())
    .post("/pay/sandboxes")
    .set("x-bff-key", "test-bff-key")
    .set("x-client-ip", `10.20.0.${++ipCounter}`)
    .expect(201);
  return response.body;
}

const as = (key: string) => ({
  get: (path: string) => request(server()).get(path).set("Authorization", `Bearer ${key}`),
  post: (path: string, body?: object, idempotencyKey?: string) => {
    const call = request(server()).post(path).set("Authorization", `Bearer ${key}`);
    if (idempotencyKey) call.set("Idempotency-Key", idempotencyKey);
    return call.send(body);
  },
  patch: (path: string, body: object) => request(server()).patch(path).set("Authorization", `Bearer ${key}`).send(body),
});

let keyCounter = 0;
const newKey = () => `chave-teste-${Date.now()}-${++keyCounter}`;

async function paidCharge(key: string, amountCents: number): Promise<pay.Charge> {
  const { body } = await as(key).post("/pay/charges", { amountCents }, newKey()).expect(201);
  return (await as(key).post(`/pay/charges/${body.id}/simulate-payment`).expect(200)).body;
}

/** Faz as entregas pendentes da loja vencerem agora (simula o tempo passando). */
const makeDue = (merchantId: string) => sql.query("update pay_webhook_deliveries set next_attempt_at = now() where merchant_id = $1 and status = 'pending'", [merchantId]);
const runWorker = () => request(server()).post("/pay/internal/webhooks/run").set("Authorization", `Bearer ${CRON_SECRET}`).expect(200);

beforeAll(async () => {
  process.env.PAY_DATABASE_URL = process.env.PAY_TEST_DATABASE_URL;
  process.env.ERP_BFF_KEY = "test-bff-key";
  process.env.PAY_CRON_SECRET = CRON_SECRET;
  process.env.PAY_MAX_SANDBOXES = "40";

  const moduleRef = await Test.createTestingModule({
    imports: [ConfigModule.forRoot({ isGlobal: true }), ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: 1000 }]), PayModule],
    providers: [{ provide: APP_GUARD, useClass: ClientIpThrottlerGuard }],
  }).compile();
  app = moduleRef.createNestApplication({ logger: false });
  configureApp(app);
  await app.init();

  sql = new Client({ connectionString: process.env.PAY_TEST_DATABASE_URL });
  await sql.connect();
});

afterAll(async () => {
  await sql?.end();
  await app?.close();
});

describe("loja de teste e chave de API", () => {
  it("a chave aparece uma vez e o banco guarda só o hash", async () => {
    const created = await sandbox();
    expect(created.apiKey).toMatch(/^gz_test_[A-Za-z0-9_-]{32}$/);
    expect(created.webhookSecret).toMatch(/^whsec_/);

    const { rows } = await sql.query("select row_to_json(m)::text as raw from pay_merchants m where id = $1", [created.id]);
    expect(rows[0].raw).not.toContain(created.apiKey);
    expect(rows[0].raw).toContain(created.apiKey.slice(0, 16));

    const me = (await as(created.apiKey).get("/pay/merchant").expect(200)).body;
    expect(me).toMatchObject({ id: created.id, apiKeyPrefix: created.apiKey.slice(0, 16), webhookUrl: null });
    expect(JSON.stringify(me)).not.toContain(created.apiKey);
  });

  it("sem chave, chave errada ou loja expirada: 401; uma loja não enxerga a outra", async () => {
    const [first, second] = [await sandbox(), await sandbox()];
    await request(server()).get("/pay/charges").expect(401);
    await as("gz_test_" + "x".repeat(32)).get("/pay/charges").expect(401);
    await as(first.apiKey.slice(0, -1) + (first.apiKey.endsWith("a") ? "b" : "a")).get("/pay/charges").expect(401);

    const { body: charge } = await as(first.apiKey).post("/pay/charges", { amountCents: 1000 }, newKey()).expect(201);
    await as(second.apiKey).get(`/pay/charges/${charge.id}`).expect(404);
    await as(second.apiKey).post(`/pay/charges/${charge.id}/simulate-payment`).expect(404);
    expect((await as(second.apiKey).get("/pay/charges").expect(200)).body.total).toBe(0);

    await sql.query("update pay_merchants set expires_at = now() - interval '1 second' where id = $1", [first.id]);
    await as(first.apiKey).get("/pay/charges").expect(401);
  });
});

describe("cobranças e idempotência", () => {
  let key: string;
  beforeAll(async () => {
    key = (await sandbox()).apiKey;
  });

  it("cria a cobrança com BR Code válido; sem Idempotency-Key ou com dados inválidos, 400", async () => {
    await as(key).post("/pay/charges", { amountCents: 12_345 }).expect(400);
    for (const body of [{ amountCents: 0 }, { amountCents: 10.5 }, { amountCents: 10_000_001 }, { amountCents: "100" }, { amountCents: 100, expiresIn: 10 }, { amountCents: 100, customer: { name: "Ana", document: "123" } }]) {
      await as(key).post("/pay/charges", body, newKey()).expect(400);
    }

    const { body } = await as(key)
      .post("/pay/charges", { amountCents: 12_345, description: "Pedido 42", customer: { name: "Ana Souza", document: "390.533.447-05" } }, newKey())
      .expect(201);
    expect(body).toMatchObject({ status: "pending", amountCents: 12_345, feeCents: 0, refundedCents: 0, customer: { name: "Ana Souza", document: "39053344705" } });
    const { fields, crcValid } = parseBrCode(body.brCode);
    expect(crcValid).toBe(true);
    expect(fields["54"]).toBe("123.45");
    expect(fields["62"]).toBe(`0525${body.txid}`);
  });

  it("mesma chave e mesmo corpo devolvem a MESMA cobrança; corpo diferente é recusado", async () => {
    const idem = newKey();
    const first = await as(key).post("/pay/charges", { amountCents: 500 }, idem).expect(201);
    const again = await as(key).post("/pay/charges", { amountCents: 500 }, idem).expect(201);
    expect(again.headers["idempotent-replayed"]).toBe("true");
    expect(first.headers["idempotent-replayed"]).toBeUndefined();
    expect(again.body).toEqual(first.body);
    const conflict = await as(key).post("/pay/charges", { amountCents: 501 }, idem).expect(422);
    expect(conflict.body.error).toBe("conflict");
  });

  it("dez requisições simultâneas com a mesma chave criam uma cobrança só", async () => {
    const idem = newKey();
    const responses = await Promise.all(Array.from({ length: 10 }, () => as(key).post("/pay/charges", { amountCents: 777 }, idem)));
    expect(responses.map((response) => response.status)).toEqual(Array(10).fill(201));
    expect(new Set(responses.map((response) => response.body.id)).size).toBe(1);
    const { rows } = await sql.query("select count(*)::int as total from pay_charges where amount = 777");
    expect(rows[0].total).toBe(1);
  });

  it("lista com filtro e paginação", async () => {
    const { body } = await as(key).get("/pay/charges?pageSize=2&status=pending").expect(200);
    expect(body.items).toHaveLength(2);
    expect(body.total).toBeGreaterThanOrEqual(3);
    await as(key).get("/pay/charges?status=talvez").expect(400);
  });
});

describe("pagamento, estorno e livro-caixa", () => {
  it("pagamento lança partidas dobradas com a taxa de 0,99% e não pode ser pago duas vezes", async () => {
    const { apiKey } = await sandbox();
    const charge = await paidCharge(apiKey, 12_345);
    expect(charge).toMatchObject({ status: "paid", feeCents: 122 });
    expect(charge.paidAt).not.toBeNull();
    const again = await as(apiKey).post(`/pay/charges/${charge.id}/simulate-payment`).expect(409);
    expect(again.body.message).toMatch(/já foi paga/);

    const ledger: pay.LedgerEntry[] = (await as(apiKey).get(`/pay/ledger?chargeId=${charge.id}`).expect(200)).body;
    expect(ledger.map(({ account, direction, amountCents }) => [account, direction, amountCents])).toEqual([
      ["platform:pix_settlement", "debit", 12_345],
      ["merchant", "credit", 12_223],
      ["platform:fees", "credit", 122],
    ]);
    expect(await as(apiKey).get("/pay/balance").expect(200)).toHaveProperty("body", {
      availableCents: 12_223,
      grossCents: 12_345,
      feesCents: 122,
      refundedCents: 0,
      ledgerBalanced: true,
    });
  });

  it("quinze confirmações simultâneas do mesmo Pix: uma paga, as outras são recusadas", async () => {
    const { apiKey } = await sandbox();
    const { body: charge } = await as(apiKey).post("/pay/charges", { amountCents: 5000 }, newKey()).expect(201);
    const responses = await Promise.all(Array.from({ length: 15 }, () => as(apiKey).post(`/pay/charges/${charge.id}/simulate-payment`)));
    expect(responses.filter((response) => response.status === 200)).toHaveLength(1);
    expect(responses.filter((response) => response.status === 409)).toHaveLength(14);
    const { rows } = await sql.query("select count(*)::int as total from pay_ledger_transactions where charge_id = $1", [charge.id]);
    expect(rows[0].total).toBe(1);
  });

  it("estorno parcial, total e as recusas: cobrança pendente, valor acima do restante, sem Idempotency-Key", async () => {
    const { apiKey } = await sandbox();
    const pending = (await as(apiKey).post("/pay/charges", { amountCents: 100 }, newKey()).expect(201)).body;
    await as(apiKey).post(`/pay/charges/${pending.id}/refunds`, {}, newKey()).expect(409);

    // Saldo para estornar: uma venda maior antes.
    await paidCharge(apiKey, 50_000);
    const charge = await paidCharge(apiKey, 10_000);
    await as(apiKey).post(`/pay/charges/${charge.id}/refunds`, { amountCents: 3000 }).expect(400);

    const partial = (await as(apiKey).post(`/pay/charges/${charge.id}/refunds`, { amountCents: 3000 }, newKey()).expect(201)).body;
    expect(partial).toMatchObject({ status: "partially_refunded", refundedCents: 3000 });
    await as(apiKey).post(`/pay/charges/${charge.id}/refunds`, { amountCents: 7001 }, newKey()).expect(409);
    const full = (await as(apiKey).post(`/pay/charges/${charge.id}/refunds`, {}, newKey()).expect(201)).body;
    expect(full).toMatchObject({ status: "refunded", refundedCents: 10_000 });
    const done = await as(apiKey).post(`/pay/charges/${charge.id}/refunds`, {}, newKey()).expect(409);
    expect(done.body.message).toMatch(/por inteiro/);

    // 50.000 − 495 + 10.000 − 99 − 10.000 de estorno (a taxa não volta).
    expect((await as(apiKey).get("/pay/balance").expect(200)).body).toMatchObject({ availableCents: 49_406, refundedCents: 10_000, ledgerBalanced: true });
  });

  it("dez estornos simultâneos: o saldo nunca fica negativo e nada é estornado além do pago", async () => {
    const { apiKey, id } = await sandbox();
    const charge = await paidCharge(apiKey, 10_000); // saldo da loja: 9.901
    const responses = await Promise.all(Array.from({ length: 10 }, () => as(apiKey).post(`/pay/charges/${charge.id}/refunds`, { amountCents: 2000 }, newKey())));
    const statuses = responses.map((response) => response.status).sort();
    expect(statuses.filter((status) => status === 201)).toHaveLength(4); // 8.000; o 5º passaria do saldo
    expect(statuses.filter((status) => status === 409)).toHaveLength(6);
    expect(responses.some((response) => response.body.error === "insufficient_balance")).toBe(true);

    const balance = (await as(apiKey).get("/pay/balance").expect(200)).body;
    expect(balance.availableCents).toBe(1901);
    const { rows } = await sql.query("select refunded from pay_charges where id = $1", [charge.id]);
    expect(rows[0].refunded).toBe("8000");
    const merchantDebits = await sql.query(
      "select count(*)::int as total from pay_ledger_entries e join pay_ledger_transactions t on t.id = e.transaction_id where t.merchant_id = $1 and t.kind = 'refund' and e.direction = 'debit'",
      [id],
    );
    expect(merchantDebits.rows[0].total).toBe(4);
  });

  it("estorno repetido com a mesma chave não estorna duas vezes", async () => {
    const { apiKey } = await sandbox();
    await paidCharge(apiKey, 20_000);
    const charge = await paidCharge(apiKey, 1000);
    const idem = newKey();
    const responses = await Promise.all(Array.from({ length: 5 }, () => as(apiKey).post(`/pay/charges/${charge.id}/refunds`, { amountCents: 400 }, idem)));
    expect(responses.map((response) => response.status)).toEqual(Array(5).fill(201));
    expect((await as(apiKey).get(`/pay/charges/${charge.id}`).expect(200)).body.refundedCents).toBe(400);
  });

  it("Pix vencido vira expirado, gera evento e não pode mais ser pago", async () => {
    const { apiKey, id } = await sandbox();
    const { body: charge } = await as(apiKey).post("/pay/charges", { amountCents: 900, expiresIn: 60 }, newKey()).expect(201);
    await sql.query("update pay_charges set expires_at = now() - interval '1 second' where id = $1", [charge.id]);
    const refused = await as(apiKey).post(`/pay/charges/${charge.id}/simulate-payment`).expect(409);
    expect(refused.body.message).toMatch(/expirou/);
    expect((await as(apiKey).get(`/pay/charges/${charge.id}`).expect(200)).body.status).toBe("expired");
    const { rows } = await sql.query("select count(*)::int as total from pay_webhook_deliveries where merchant_id = $1 and event_type = 'charge.expired'", [id]);
    expect(rows[0].total).toBe(1);
  });
});

describe("regras garantidas pelo próprio banco", () => {
  it("transação desbalanceada não passa do COMMIT; lançamento não se altera nem se apaga", async () => {
    const { apiKey } = await sandbox();
    const charge = await paidCharge(apiKey, 3000);
    const { rows } = await sql.query("select id, merchant_id from pay_ledger_transactions where charge_id = $1", [charge.id]);

    await sql.query("begin");
    const { rows: tx } = await sql.query("insert into pay_ledger_transactions (merchant_id, charge_id, kind) values ($1, $2, 'refund') returning id", [rows[0].merchant_id, charge.id]);
    await sql.query("insert into pay_ledger_entries (transaction_id, account, direction, amount) values ($1, 'platform:fees', 'debit', 50)", [tx[0].id]);
    await expect(sql.query("commit")).rejects.toThrow(/desbalanceada/);

    await expect(sql.query("update pay_ledger_entries set amount = 1 where transaction_id = $1", [rows[0].id])).rejects.toThrow(/imutável/);
    await expect(sql.query("delete from pay_ledger_entries where transaction_id = $1", [rows[0].id])).rejects.toThrow(/imutável/);
    await expect(sql.query("update pay_charges set refunded = amount + 1 where id = $1", [charge.id])).rejects.toThrow(/pay_charges_refund_within_amount/);
  });

  it("a loja de teste expirada é apagada com tudo dela, livro-caixa incluso", async () => {
    const created = await sandbox();
    await paidCharge(created.apiKey, 2000);
    await sql.query("delete from pay_merchants where id = $1", [created.id]);
    const { rows } = await sql.query("select count(*)::int as total from pay_ledger_transactions where merchant_id = $1", [created.id]);
    expect(rows[0].total).toBe(0);
    const { rows: all } = await sql.query("select coalesce(sum(case direction when 'debit' then amount else -amount end), 0)::int as difference from pay_ledger_entries");
    expect(all[0].difference).toBe(0);
  });
});

describe("webhooks", () => {
  it("entrega assinada no inspetor, que confere a assinatura como um servidor de verdade", async () => {
    const { apiKey, webhookSecret } = await sandbox();
    const charge = await paidCharge(apiKey, 4200);
    const deliveries: pay.WebhookDelivery[] = (await as(apiKey).get("/pay/webhooks/deliveries").expect(200)).body;
    expect(deliveries.map((delivery) => [delivery.eventType, delivery.status, delivery.attempts])).toEqual([
      ["charge.paid", "delivered", 1],
      ["charge.created", "delivered", 1],
    ]);
    expect(deliveries[0]!.payload).toMatchObject({ type: "charge.paid", data: { charge: { id: charge.id, status: "paid" } } });

    const received: pay.InspectorRequest[] = (await as(apiKey).get("/pay/webhooks/inspector").expect(200)).body;
    expect(received).toHaveLength(2);
    for (const item of received) {
      expect(item.signatureValid).toBe(true);
      expect(verifySignature(webhookSecret, item.body, item.headers["godzilla-signature"])).toBe(true);
      expect(verifySignature("outro-segredo", item.body, item.headers["godzilla-signature"])).toBe(false);
    }
  });

  it("destino fora do ar: novas tentativas com espera crescente até entregar", async () => {
    const { apiKey, id } = await sandbox();
    await as(apiKey).patch("/pay/webhooks/settings", { failNext: 3 }).expect(200);
    const charge = await paidCharge(apiKey, 1500); // charge.created e charge.paid falham na 1ª tentativa

    let paid = (await as(apiKey).get("/pay/webhooks/deliveries").expect(200)).body.find((d: pay.WebhookDelivery) => d.eventType === "charge.paid");
    expect(paid).toMatchObject({ status: "pending", attempts: 1, lastStatusCode: 500 });
    const wait = (new Date(paid.nextAttemptAt).getTime() - Date.now()) / 1000;
    expect(wait).toBeGreaterThan(20);
    expect(wait).toBeLessThanOrEqual(31);

    // O tempo "passa" e o agendador roda: a 3ª falha programada, depois sucesso.
    await makeDue(id);
    await runWorker();
    await makeDue(id);
    await runWorker();
    paid = (await as(apiKey).get("/pay/webhooks/deliveries").expect(200)).body.find((d: pay.WebhookDelivery) => d.chargeId === charge.id && d.eventType === "charge.paid");
    expect(paid.status).toBe("delivered");
    expect(paid.history.map((attempt: { statusCode: number }) => attempt.statusCode)).toEqual(paid.attempts === 2 ? [500, 200] : [500, 500, 200]);
  });

  it("depois de seis falhas a entrega vira falha definitiva; o reenvio manual entrega", async () => {
    const { apiKey, id } = await sandbox();
    await as(apiKey).patch("/pay/webhooks/settings", { failNext: 1 }).expect(200);
    await as(apiKey).post("/pay/charges", { amountCents: 300 }, newKey()).expect(201);
    await as(apiKey).get("/pay/webhooks/deliveries").expect(200); // 1ª tentativa: falha programada
    await sql.query("update pay_webhook_deliveries set attempts = 5, next_attempt_at = now() where merchant_id = $1", [id]);
    await as(apiKey).patch("/pay/webhooks/settings", { failNext: 1 }).expect(200);
    await runWorker();

    const [failed]: pay.WebhookDelivery[] = (await as(apiKey).get("/pay/webhooks/deliveries").expect(200)).body;
    expect(failed).toMatchObject({ status: "failed", attempts: 6, nextAttemptAt: null });
    const retried = (await as(apiKey).post(`/pay/webhooks/deliveries/${failed!.id}/retry`).expect(200)).body;
    expect(retried).toMatchObject({ status: "delivered", attempts: 7, lastStatusCode: 200 });
  });

  it("cinco trabalhadores ao mesmo tempo: cada entrega é tentada uma vez só (SKIP LOCKED)", async () => {
    const { apiKey, id } = await sandbox();
    // Criar cobrança só enfileira o evento: ninguém tentou entregar ainda.
    for (let index = 0; index < 5; index++) await as(apiKey).post("/pay/charges", { amountCents: 100 + index }, newKey()).expect(201);
    await makeDue(id);
    await Promise.all(Array.from({ length: 5 }, () => runWorker()));
    const { rows } = await sql.query(
      "select d.id, count(a.id)::int as tries from pay_webhook_deliveries d left join pay_webhook_attempts a on a.delivery_id = d.id where d.merchant_id = $1 group by d.id",
      [id],
    );
    expect(rows).toHaveLength(5);
    for (const row of rows) expect(row.tries).toBe(1);
  });

  it("URL própria precisa ser https pública; o agendador exige o segredo", async () => {
    const { apiKey } = await sandbox();
    for (const url of ["http://example.com/hook", "https://127.0.0.1/hook", "https://localhost/hook", "https://169.254.169.254/latest"]) {
      await as(apiKey).patch("/pay/webhooks/settings", { url }).expect(400);
    }
    expect((await as(apiKey).patch("/pay/webhooks/settings", { url: "https://example.com/hook" }).expect(200)).body.webhookUrl).toBe("https://example.com/hook");
    expect((await as(apiKey).patch("/pay/webhooks/settings", { url: null }).expect(200)).body.webhookUrl).toBeNull();
    await as(apiKey).patch("/pay/webhooks/settings", { failNext: 9 }).expect(400);

    await request(server()).post("/pay/internal/webhooks/run").expect(401);
    await request(server()).post("/pay/internal/webhooks/run").set("Authorization", "Bearer errado").expect(401);
  });
});
