import { createHash } from "node:crypto";
import { HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import type { erp } from "@portfolio/shared";
import type { ErpSession } from "../common/auth";
import { ErpException, notFound } from "../common/errors";
import { toOrder } from "../mappers";
import { OrdersService } from "../orders/orders.service";
import { Customer, Order, Workspace } from "../schemas";

const tenant = (session: ErpSession) => new Types.ObjectId(session.workspaceId);
const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const money = (cents: number) => brl.format(cents / 100);

/**
 * Confere os pagamentos contra o total calculado pela API e devolve o troco.
 * Cartão e Pix cobram exatamente o que foi digitado, então não podem passar do
 * total; só dinheiro pode sobrar — e o que sobra vira troco.
 */
export function settlePayments(payments: erp.Payment[], totalCents: number): number {
  const paid = payments.reduce((sum, payment) => sum + payment.amountCents, 0);
  const nonCash = payments.filter((payment) => payment.method !== "cash").reduce((sum, payment) => sum + payment.amountCents, 0);
  if (nonCash > totalCents) throw validation(`Cartão e Pix não podem passar do total da venda (${money(totalCents)})`);
  if (paid < totalCents) throw validation(`Pagamento insuficiente: faltam ${money(totalCents - paid)}`);
  return paid - totalCents;
}

/** Impressão digital do corpo: a mesma chave com outra venda é recusada. */
export function fingerprint(input: erp.PosSaleInputParsed): string {
  const normalized = {
    items: [...input.items].sort((a, b) => a.productId.localeCompare(b.productId)),
    discountCents: input.discountCents,
    customerId: input.customerId ?? null,
    payments: [...input.payments].sort((a, b) => a.method.localeCompare(b.method) || a.amountCents - b.amountCents),
  };
  return createHash("sha256").update(JSON.stringify(normalized)).digest("hex");
}

function validation(message: string) {
  return new ErpException("validation_error", message, HttpStatus.BAD_REQUEST);
}

const isDuplicateKey = (error: unknown) => typeof error === "object" && error !== null && (error as { code?: unknown }).code === 11000;

/**
 * Frente de caixa: a venda nasce confirmada, com o estoque baixado na mesma
 * transação que grava a venda e os pagamentos.
 *
 * Idempotência: o PDV manda uma chave única por venda (header
 * Idempotency-Key). Se a requisição for repetida — clique duplo, rede que caiu
 * depois de a venda gravar — a API devolve a MESMA venda em vez de criar outra
 * e baixar o estoque de novo. A chave é única por empresa no banco, então nem
 * duas requisições simultâneas passam.
 */
@Injectable()
export class PosService {
  constructor(
    @InjectModel(Order.name) private readonly orders: Model<Order>,
    @InjectModel(Customer.name) private readonly customers: Model<Customer>,
    @InjectModel(Workspace.name) private readonly workspaces: Model<Workspace>,
    private readonly sales: OrdersService,
  ) {}

  async sell(session: ErpSession, input: erp.PosSaleInputParsed, key: string): Promise<{ order: erp.Order; replayed: boolean }> {
    const workspaceId = tenant(session);
    const hash = fingerprint(input);

    const previous = await this.orders.findOne({ workspaceId, idempotencyKey: key }).lean();
    if (previous) return this.replay(previous, hash);

    const { items, subtotalCents } = await this.sales.buildItems(session, input.items);
    if (input.discountCents > subtotalCents) throw validation("O desconto não pode ser maior que o subtotal");
    const totalCents = subtotalCents - input.discountCents;
    const changeCents = settlePayments(input.payments, totalCents);

    const customer = input.customerId ? await this.customers.findOne({ _id: input.customerId, workspaceId }).lean() : null;
    if (input.customerId && !customer) throw notFound("Cliente");
    const workspace = await this.workspaces.findById(workspaceId).lean();
    if (!workspace) throw new ErpException("unauthorized", "Esta demonstração expirou — entre de novo", HttpStatus.UNAUTHORIZED);

    try {
      const order = await this.sales.inTransaction(async (db) => {
        const number = await this.sales.nextNumber(workspaceId, workspace.expiresAt, db);
        const [created] = await this.orders.create(
          [
            {
              workspaceId,
              number,
              channel: "pos",
              ...(customer ? { customerId: customer._id, customerName: customer.name } : {}),
              items,
              subtotalCents,
              discountCents: input.discountCents,
              totalCents,
              status: "confirmed",
              confirmedAt: new Date(),
              payments: input.payments,
              changeCents,
              idempotencyKey: key,
              idempotencyHash: hash,
              createdByRole: session.role,
              expiresAt: workspace.expiresAt,
            },
          ],
          { session: db },
        );
        await this.sales.deductStock(session, created!, `Venda no PDV — #${number}`, db);
        return toOrder(created!.toObject());
      });
      return { order, replayed: false };
    } catch (error) {
      // Duas requisições com a mesma chave ao mesmo tempo: a segunda perde no índice único e devolve a primeira.
      if (isDuplicateKey(error)) {
        const winner = await this.orders.findOne({ workspaceId, idempotencyKey: key }).lean();
        if (winner) return this.replay(winner, hash);
      }
      throw error;
    }
  }

  private replay(order: Order & { _id: Types.ObjectId }, hash: string) {
    if (order.idempotencyHash !== hash) {
      throw new ErpException("conflict", "Esta chave de idempotência já foi usada em outra venda", HttpStatus.CONFLICT);
    }
    return { order: toOrder(order), replayed: true };
  }
}
