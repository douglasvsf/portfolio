import { HttpStatus, Injectable } from "@nestjs/common";
import { randomBytes } from "node:crypto";
import type { PoolClient } from "pg";
import { pay } from "@portfolio/shared";
import { ErpException, invalidState, notFound } from "../erp/common/errors";
import { buildBrCode } from "./brcode";
import { PayDatabase, type Queryable } from "./db";
import { idempotent, requestHash, type IdempotentResult } from "./idempotency";
import type { MerchantRow } from "./merchants";
import { WebhooksService } from "./webhooks.service";

/**
 * Cobranças Pix e o livro-caixa de partidas dobradas.
 *
 * Contas: o saldo da loja (merchant:<id>), o que a plataforma tem a receber
 * dos bancos (platform:pix_settlement) e a receita de taxas (platform:fees).
 *
 *   pagamento de R$ 100   débito  pix_settlement 100,00
 *                         crédito merchant        99,01
 *                         crédito fees             0,99
 *   estorno de R$ 30      débito  merchant        30,00
 *                         crédito pix_settlement  30,00
 *
 * Concorrência: pagar e estornar travam a linha da cobrança (FOR NO KEY UPDATE),
 * e o estorno trava também a loja — dois estornos ao mesmo tempo nunca deixam o
 * saldo negativo nem estornam mais do que foi pago.
 */

interface ChargeRow {
  id: string;
  merchant_id: string;
  txid: string;
  status: pay.ChargeStatus;
  amount: number;
  fee: number;
  refunded: number;
  description: string | null;
  customer_name: string | null;
  customer_document: string | null;
  br_code: string;
  expires_at: Date;
  paid_at: Date | null;
  created_at: Date;
}

export const toCharge = (row: ChargeRow): pay.Charge => ({
  id: row.id,
  txid: row.txid,
  status: row.status,
  amountCents: row.amount,
  feeCents: row.fee,
  refundedCents: row.refunded,
  description: row.description,
  customer: row.customer_name ? { name: row.customer_name, document: row.customer_document } : null,
  brCode: row.br_code,
  expiresAt: row.expires_at.toISOString(),
  paidAt: row.paid_at ? row.paid_at.toISOString() : null,
  createdAt: row.created_at.toISOString(),
});

const merchantAccount = (merchantId: string) => `merchant:${merchantId}`;
const SETTLEMENT = "platform:pix_settlement";
const FEES = "platform:fees";

/** txid: 25 letras maiúsculas e números (o máximo do Pix com chave). */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newTxid = () => Array.from(randomBytes(25), (byte) => ALPHABET[byte % ALPHABET.length]).join("");

@Injectable()
export class ChargesService {
  constructor(
    private readonly db: PayDatabase,
    private readonly webhooks: WebhooksService,
  ) {}

  create(merchant: MerchantRow, input: pay.ChargeCreate, idempotencyKey: string): Promise<IdempotentResult<pay.Charge>> {
    return this.db.transaction((client) =>
      idempotent(client, merchant.id, `charge:${idempotencyKey}`, requestHash(input), async () => {
        const txid = newTxid();
        const brCode = buildBrCode({ pixKey: merchant.pix_key, amountCents: input.amountCents, merchantName: merchant.name, merchantCity: "Sao Paulo", txid, description: input.description });
        const { rows } = await client.query<ChargeRow>(
          `insert into pay_charges (merchant_id, txid, amount, description, customer_name, customer_document, br_code, expires_at)
           values ($1, $2, $3, $4, $5, $6, $7, now() + make_interval(secs => $8))
           returning *`,
          [merchant.id, txid, input.amountCents, input.description || null, input.customer?.name ?? null, input.customer?.document ?? null, brCode, input.expiresIn],
        );
        const charge = toCharge(rows[0]!);
        await this.webhooks.enqueue(client, merchant, "charge.created", charge);
        return { statusCode: HttpStatus.CREATED, body: charge };
      }),
    );
  }

  async list(merchant: MerchantRow, query: pay.ChargeListQuery): Promise<{ items: pay.Charge[]; page: number; pageSize: number; total: number }> {
    await this.db.transaction((client) => this.expireDue(client, merchant));
    const filter = query.status ? "and status = $2" : "and $2::text is null";
    const { rows } = await this.db.query<ChargeRow & { total: number }>(
      `select *, count(*) over ()::int as total from pay_charges
       where merchant_id = $1 ${filter}
       order by created_at desc, id limit $3 offset $4`,
      [merchant.id, query.status ?? null, query.pageSize, (query.page - 1) * query.pageSize],
    );
    return { items: rows.map(toCharge), page: query.page, pageSize: query.pageSize, total: rows[0]?.total ?? 0 };
  }

  async get(merchant: MerchantRow, id: string): Promise<pay.Charge> {
    await this.db.transaction((client) => this.expireDue(client, merchant, id));
    const { rows } = await this.db.query<ChargeRow>("select * from pay_charges where id = $1 and merchant_id = $2", [id, merchant.id]);
    if (!rows[0]) throw notFound("Cobrança");
    return toCharge(rows[0]);
  }

  /** Sandbox: faz de conta que o banco do pagador confirmou o Pix. */
  simulatePayment(merchant: MerchantRow, id: string): Promise<pay.Charge> {
    return this.db.transaction(async (client) => {
      await this.expireDue(client, merchant, id);
      const row = await this.lockCharge(client, merchant, id);
      if (row.status === "expired") throw invalidState("Esta cobrança expirou: o Pix não pode mais ser pago.");
      if (row.status !== "pending") throw invalidState("Esta cobrança já foi paga.");

      const fee = pay.feeFor(row.amount);
      const { rows } = await client.query<ChargeRow>("update pay_charges set status = 'paid', fee = $2, paid_at = now() where id = $1 returning *", [id, fee]);
      await this.post(client, merchant, id, "payment", [
        { account: SETTLEMENT, direction: "debit", amount: row.amount },
        { account: merchantAccount(merchant.id), direction: "credit", amount: row.amount - fee },
        { account: FEES, direction: "credit", amount: fee },
      ]);
      const charge = toCharge(rows[0]!);
      await this.webhooks.enqueue(client, merchant, "charge.paid", charge);
      return charge;
    });
  }

  refund(merchant: MerchantRow, id: string, input: pay.RefundInput, idempotencyKey: string): Promise<IdempotentResult<pay.Charge>> {
    return this.db.transaction((client) =>
      idempotent(client, merchant.id, `refund:${id}:${idempotencyKey}`, requestHash(input), async () => {
        // Trava a loja: estornos dela entram em fila, e o saldo lido abaixo não muda até o COMMIT.
        // FOR NO KEY UPDATE, e não FOR UPDATE: gravar a chave de idempotência (FK para a loja) já deixou
        // um KEY SHARE nesta linha, e FOR UPDATE conflitaria com o KEY SHARE de outra transação — deadlock.
        await client.query("select id from pay_merchants where id = $1 for no key update", [merchant.id]);
        const row = await this.lockCharge(client, merchant, id);
        if (row.status === "refunded") throw invalidState("Esta cobrança já foi estornada por inteiro.");
        if (row.status !== "paid" && row.status !== "partially_refunded") throw invalidState("Só cobranças pagas podem ser estornadas.");

        const remaining = row.amount - row.refunded;
        const amount = input.amountCents ?? remaining;
        if (amount > remaining) throw invalidState(`Valor acima do que resta para estornar (${remaining} centavos).`);
        const available = await this.available(client, merchant.id);
        if (amount > available) {
          throw new ErpException("insufficient_balance", "Saldo insuficiente para este estorno.", HttpStatus.CONFLICT, { availableCents: available });
        }

        const refunded = row.refunded + amount;
        const { rows } = await client.query<ChargeRow>("update pay_charges set refunded = $2, status = $3 where id = $1 returning *", [
          id,
          refunded,
          refunded === row.amount ? "refunded" : "partially_refunded",
        ]);
        await this.post(client, merchant, id, "refund", [
          { account: merchantAccount(merchant.id), direction: "debit", amount },
          { account: SETTLEMENT, direction: "credit", amount },
        ]);
        const charge = toCharge(rows[0]!);
        await this.webhooks.enqueue(client, merchant, "charge.refunded", charge, { refund: { amountCents: amount } });
        return { statusCode: HttpStatus.CREATED, body: charge };
      }),
    );
  }

  async balance(merchant: MerchantRow): Promise<pay.Balance> {
    const { rows } = await this.db.query<{ gross: number; fees: number; refunded: number; platform_difference: number }>(
      `select
         coalesce(sum(amount) filter (where status <> 'pending' and status <> 'expired'), 0)::bigint as gross,
         coalesce(sum(fee), 0)::bigint as fees,
         coalesce(sum(refunded), 0)::bigint as refunded,
         (select coalesce(sum(case direction when 'debit' then amount else -amount end), 0)::bigint from pay_ledger_entries) as platform_difference
       from pay_charges where merchant_id = $1`,
      [merchant.id],
    );
    const totals = rows[0]!;
    return {
      availableCents: await this.available(this.db, merchant.id),
      grossCents: totals.gross,
      feesCents: totals.fees,
      refundedCents: totals.refunded,
      ledgerBalanced: totals.platform_difference === 0,
    };
  }

  async ledger(merchant: MerchantRow, chargeId?: string): Promise<pay.LedgerEntry[]> {
    const { rows } = await this.db.query<{
      transaction_id: string;
      kind: "payment" | "refund";
      charge_id: string;
      account: string;
      direction: "debit" | "credit";
      amount: number;
      created_at: Date;
    }>(
      `select t.id as transaction_id, t.kind, t.charge_id, e.account, e.direction, e.amount, t.created_at
       from pay_ledger_transactions t join pay_ledger_entries e on e.transaction_id = t.id
       where t.merchant_id = $1 and ($2::uuid is null or t.charge_id = $2)
       order by t.created_at desc, e.id
       limit 200`,
      [merchant.id, chargeId ?? null],
    );
    return rows.map((row) => ({
      transactionId: row.transaction_id,
      kind: row.kind,
      chargeId: row.charge_id,
      account: row.account.startsWith("merchant:") ? "merchant" : row.account,
      direction: row.direction,
      amountCents: row.amount,
      createdAt: row.created_at.toISOString(),
    }));
  }

  /** Saldo da loja = créditos − débitos na conta dela. */
  private async available(client: Queryable, merchantId: string): Promise<number> {
    const { rows } = await client.query<{ available: number }>(
      `select coalesce(sum(case direction when 'credit' then amount else -amount end), 0)::bigint as available
       from pay_ledger_entries where account = $1`,
      [merchantAccount(merchantId)],
    );
    return rows[0]!.available;
  }

  private async lockCharge(client: PoolClient, merchant: MerchantRow, id: string): Promise<ChargeRow> {
    const { rows } = await client.query<ChargeRow>("select * from pay_charges where id = $1 and merchant_id = $2 for no key update", [id, merchant.id]);
    if (!rows[0]) throw notFound("Cobrança");
    return rows[0];
  }

  /** Lança uma transação no livro. Lançamento de valor zero (taxa de cobrança minúscula) não entra. */
  private async post(client: PoolClient, merchant: MerchantRow, chargeId: string, kind: "payment" | "refund", entries: { account: string; direction: "debit" | "credit"; amount: number }[]) {
    const { rows } = await client.query<{ id: string }>("insert into pay_ledger_transactions (merchant_id, charge_id, kind) values ($1, $2, $3) returning id", [merchant.id, chargeId, kind]);
    const lines = entries.filter((entry) => entry.amount > 0);
    await client.query(
      `insert into pay_ledger_entries (transaction_id, account, direction, amount)
       select $1, account, direction, amount from unnest($2::text[], $3::text[], $4::bigint[]) as t(account, direction, amount)`,
      [rows[0]!.id, lines.map((line) => line.account), lines.map((line) => line.direction), lines.map((line) => line.amount)],
    );
  }

  /** Pix vencido vira "expirada" (e gera o evento) na primeira vez que alguém olha para ele. */
  private async expireDue(client: PoolClient, merchant: MerchantRow, chargeId?: string) {
    const { rows } = await client.query<ChargeRow>(
      `update pay_charges set status = 'expired'
       where merchant_id = $1 and status = 'pending' and expires_at <= now() and ($2::uuid is null or id = $2)
       returning *`,
      [merchant.id, chargeId ?? null],
    );
    for (const row of rows) await this.webhooks.enqueue(client, merchant, "charge.expired", toCharge(row));
  }
}
