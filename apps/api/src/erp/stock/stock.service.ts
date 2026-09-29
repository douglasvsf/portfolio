import { HttpStatus, Injectable } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { ClientSession, Connection, Model, Types } from "mongoose";
import type { erp } from "@portfolio/shared";
import type { ErpSession } from "../common/auth";
import { ErpException, notFound } from "../common/errors";
import { paginate, toMovement } from "../mappers";
import { Product, StockMovement } from "../schemas";

export interface MovementMeta {
  type: erp.MovementType;
  reason: string;
  orderId?: Types.ObjectId;
  orderNumber?: number;
}

/**
 * Estoque: saldo no produto + livro-razão imutável de movimentações.
 *
 * O saldo muda só por `applyDelta`: um update atômico e condicional — a saída
 * só acontece se `stock >= quantidade` no momento da escrita. Duas vendas
 * simultâneas do último item não passam as duas: uma recebe `null` e a
 * operação inteira (dentro da transação) é desfeita.
 */
@Injectable()
export class StockService {
  constructor(
    @InjectModel(Product.name) private readonly products: Model<Product>,
    @InjectModel(StockMovement.name) private readonly movements: Model<StockMovement>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  /** Aplica a variação e registra a movimentação. `null` se deixaria o estoque negativo. */
  async applyDelta(session: ErpSession, productId: Types.ObjectId, delta: number, meta: MovementMeta, db: ClientSession) {
    const workspaceId = new Types.ObjectId(session.workspaceId);
    const updated = await this.products.findOneAndUpdate(
      { _id: productId, workspaceId, ...(delta < 0 ? { stock: { $gte: -delta } } : {}) },
      // Pipeline com $round: somar 0,1 + 0,2 kg não pode virar 0,30000000000000004.
      [{ $set: { stock: { $round: [{ $add: ["$stock", delta] }, 3] } } }],
      { returnDocument: "after", session: db, updatePipeline: true },
    );
    if (!updated) return null;

    const [movement] = await this.movements.create(
      [
        {
          workspaceId,
          productId,
          productName: updated.name,
          delta,
          balanceAfter: updated.stock,
          role: session.role,
          expiresAt: updated.expiresAt,
          ...meta,
        },
      ],
      { session: db },
    );
    return { product: updated, movement: movement! };
  }

  /** Movimentação manual (admin): entrada, saída ou ajuste de inventário — em transação. */
  async register(session: ErpSession, input: erp.StockMovementInput): Promise<erp.StockMovement> {
    const workspaceId = new Types.ObjectId(session.workspaceId);
    const productId = new Types.ObjectId(input.productId);
    const db = await this.connection.startSession();
    try {
      let created: erp.StockMovement | undefined;
      await db.withTransaction(async () => {
        const product = await this.products.findOne({ _id: productId, workspaceId }).session(db);
        if (!product) throw notFound("Produto");
        if (!product.active) throw new ErpException("invalid_state", "Produto inativo não movimenta estoque", HttpStatus.CONFLICT);

        const delta =
          input.type === "in" ? input.quantity : input.type === "out" ? -input.quantity : Math.round((input.quantity - product.stock) * 1000) / 1000;
        if (delta === 0) throw new ErpException("invalid_state", "O saldo contado é igual ao atual — nada a ajustar", HttpStatus.CONFLICT);

        const applied = await this.applyDelta(session, productId, delta, { type: input.type, reason: input.reason }, db);
        if (!applied) {
          throw new ErpException("insufficient_stock", `Estoque insuficiente de ${product.name}`, HttpStatus.CONFLICT, [
            { productId: input.productId, name: product.name, requested: -delta, available: product.stock },
          ] satisfies erp.StockShortage[]);
        }
        created = toMovement(applied.movement.toObject());
      });
      return created!;
    } finally {
      await db.endSession();
    }
  }

  async list(session: ErpSession, query: erp.StockMovementQuery): Promise<erp.Paginated<erp.StockMovement>> {
    const filter = {
      workspaceId: new Types.ObjectId(session.workspaceId),
      ...(query.productId ? { productId: new Types.ObjectId(query.productId) } : {}),
      ...(query.type ? { type: query.type } : {}),
    };
    const [items, total] = await Promise.all([
      this.movements
        .find(filter)
        .sort({ createdAt: -1, _id: -1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean(),
      this.movements.countDocuments(filter),
    ]);
    return paginate(items.map(toMovement), total, query);
  }
}
