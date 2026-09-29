import { HttpStatus, Injectable } from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { ClientSession, Connection, Model, Types } from "mongoose";
import type { erp } from "@portfolio/shared";
import type { ErpSession } from "../common/auth";
import { ErpException, invalidState, notFound } from "../common/errors";
import { paginate, toOrder } from "../mappers";
import { Counter, Customer, Order, OrderItem, Product } from "../schemas";
import { StockService } from "../stock/stock.service";

const tenant = (session: ErpSession) => new Types.ObjectId(session.workspaceId);
const round3 = (value: number) => Math.round(value * 1000) / 1000;

/**
 * Pedidos: rascunho → confirmado → cancelado.
 *
 * - Rascunho não mexe no estoque e pode ser editado.
 * - Confirmar baixa o estoque de todos os itens numa transação: ou tudo, ou
 *   nada. Se faltar produto, nenhum saldo muda e a resposta lista todos os
 *   itens em falta (não só o primeiro).
 * - Cancelar um confirmado devolve o estoque, também em transação.
 * - O preço de cada item é congelado quando entra no pedido.
 */
@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orders: Model<Order>,
    @InjectModel(Product.name) private readonly products: Model<Product>,
    @InjectModel(Customer.name) private readonly customers: Model<Customer>,
    @InjectModel(Counter.name) private readonly counters: Model<Counter>,
    @InjectConnection() private readonly connection: Connection,
    private readonly stock: StockService,
  ) {}

  async list(session: ErpSession, query: erp.OrderQuery): Promise<erp.Paginated<erp.Order>> {
    const filter = {
      workspaceId: tenant(session),
      ...(query.status ? { status: query.status } : {}),
      ...(query.customerId ? { customerId: new Types.ObjectId(query.customerId) } : {}),
    };
    const [items, total] = await Promise.all([
      this.orders
        .find(filter)
        .sort({ number: -1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean(),
      this.orders.countDocuments(filter),
    ]);
    return paginate(items.map(toOrder), total, query);
  }

  async get(session: ErpSession, id: string): Promise<erp.Order> {
    const order = await this.orders.findOne({ _id: id, workspaceId: tenant(session) }).lean();
    if (!order) throw notFound("Pedido");
    return toOrder(order);
  }

  async create(session: ErpSession, input: erp.OrderInputParsed): Promise<erp.Order> {
    const workspaceId = tenant(session);
    const draft = await this.buildDraft(session, input);
    const number = await this.nextNumber(workspaceId, draft.expiresAt);
    const [order] = await this.orders.create([{ ...draft, workspaceId, number, channel: "order", status: "draft", createdByRole: session.role }]);
    return toOrder(order!.toObject());
  }

  /** Só rascunhos podem ser editados; itens e preços são recalculados. */
  async update(session: ErpSession, id: string, input: erp.OrderInputParsed): Promise<erp.Order> {
    const existing = await this.orders.findOne({ _id: id, workspaceId: tenant(session) });
    if (!existing) throw notFound("Pedido");
    if (existing.status !== "draft") throw invalidState("Só pedidos em rascunho podem ser editados");
    const draft = await this.buildDraft(session, input);
    existing.set({ ...draft, expiresAt: existing.expiresAt });
    await existing.save();
    return toOrder(existing.toObject());
  }

  async confirm(session: ErpSession, id: string): Promise<erp.Order> {
    return this.inTransaction(async (db) => {
      const order = await this.orders.findOne({ _id: id, workspaceId: tenant(session) }).session(db);
      if (!order) throw notFound("Pedido");
      if (order.status !== "draft") throw invalidState("Só pedidos em rascunho podem ser confirmados");

      await this.deductStock(session, order, `Venda — pedido #${order.number}`, db);

      order.status = "confirmed";
      order.confirmedAt = new Date();
      await order.save({ session: db });
      return toOrder(order.toObject());
    });
  }

  async cancel(session: ErpSession, id: string): Promise<erp.Order> {
    return this.inTransaction(async (db) => {
      const order = await this.orders.findOne({ _id: id, workspaceId: tenant(session) }).session(db);
      if (!order) throw notFound("Pedido");
      if (order.status === "cancelled") throw invalidState("Pedido já está cancelado");

      if (order.status === "confirmed") {
        for (const item of order.items) {
          await this.stock.applyDelta(
            session,
            item.productId,
            item.quantity,
            { type: "sale_cancel", reason: `Cancelamento — ${order.channel === "pos" ? "venda PDV" : "pedido"} #${order.number}`, orderId: order._id, orderNumber: order.number },
            db,
          );
        }
      }
      order.status = "cancelled";
      order.cancelledAt = new Date();
      await order.save({ session: db });
      return toOrder(order.toObject());
    });
  }

  /**
   * Baixa o estoque de todos os itens (dentro da transação de quem chama).
   * Checa tudo antes: quem vende recebe a lista completa do que falta.
   */
  async deductStock(session: ErpSession, order: { _id: Types.ObjectId; number: number; items: OrderItem[] }, reason: string, db: ClientSession) {
    const stocks = await this.products
      .find({ _id: { $in: order.items.map((item) => item.productId) }, workspaceId: tenant(session) })
      .session(db)
      .lean();
    const shortages: erp.StockShortage[] = order.items
      .map((item) => {
        const product = stocks.find((candidate) => candidate._id.equals(item.productId));
        const available = product?.active ? product.stock : 0;
        return { productId: item.productId.toString(), name: item.name, requested: item.quantity, available };
      })
      .filter((line) => line.available < line.requested);
    if (shortages.length) throw this.insufficient(shortages);

    for (const item of order.items) {
      const applied = await this.stock.applyDelta(session, item.productId, -item.quantity, { type: "sale", reason, orderId: order._id, orderNumber: order.number }, db);
      // Corrida com outra venda entre a checagem e a baixa: desfaz tudo.
      if (!applied) throw this.insufficient([{ productId: item.productId.toString(), name: item.name, requested: item.quantity, available: 0 }]);
    }
  }

  /** Próximo número de venda da empresa (pedidos e PDV dividem a sequência). */
  async nextNumber(workspaceId: Types.ObjectId, expiresAt: Date, db?: ClientSession) {
    const counter = await this.counters.findOneAndUpdate(
      { workspaceId, name: "order" },
      { $inc: { value: 1 }, $setOnInsert: { expiresAt } },
      { returnDocument: "after", upsert: true, session: db },
    );
    return counter.value;
  }

  /** Valida cliente e produtos da empresa e congela nome, SKU e preço de cada item. */
  private async buildDraft(session: ErpSession, input: erp.OrderInputParsed) {
    const workspaceId = tenant(session);
    const customer = await this.customers.findOne({ _id: input.customerId, workspaceId }).lean();
    if (!customer) throw notFound("Cliente");

    const { items, subtotalCents } = await this.buildItems(session, input.items);
    if (input.discountCents > subtotalCents) {
      throw new ErpException("validation_error", "O desconto não pode ser maior que o subtotal", HttpStatus.BAD_REQUEST);
    }
    return {
      customerId: customer._id,
      customerName: customer.name,
      items,
      subtotalCents,
      discountCents: input.discountCents,
      totalCents: subtotalCents - input.discountCents,
      notes: input.notes,
      expiresAt: customer.expiresAt,
    };
  }

  /** Produtos ativos da empresa, com nome, SKU e preço congelados em cada item. */
  async buildItems(session: ErpSession, lines: { productId: string; quantity: number }[]) {
    const workspaceId = tenant(session);
    const ids = lines.map((item) => new Types.ObjectId(item.productId));
    const products = await this.products.find({ _id: { $in: ids }, workspaceId, active: true }).lean();
    const items: OrderItem[] = lines.map((line) => {
      const product = products.find((candidate) => candidate._id.equals(line.productId));
      if (!product) throw notFound("Produto");
      if (product.unit === "un" && !Number.isInteger(line.quantity)) {
        throw new ErpException("validation_error", `${product.name} é vendido por unidade — use quantidade inteira`, HttpStatus.BAD_REQUEST);
      }
      return {
        productId: product._id,
        sku: product.sku,
        name: product.name,
        unit: product.unit,
        category: product.category,
        quantity: round3(line.quantity),
        unitPriceCents: product.priceCents,
        totalCents: Math.round(product.priceCents * line.quantity),
      };
    });

    return { items, subtotalCents: items.reduce((sum, item) => sum + item.totalCents, 0) };
  }

  private insufficient(shortages: erp.StockShortage[]) {
    const names = shortages.map((line) => line.name).join(", ");
    return new ErpException("insufficient_stock", `Estoque insuficiente: ${names}`, HttpStatus.CONFLICT, shortages);
  }

  /** withTransaction repete sozinho em erro transitório; erro de negócio aborta e sobe. */
  async inTransaction<T>(work: (db: ClientSession) => Promise<T>): Promise<T> {
    const db = await this.connection.startSession();
    try {
      let result: T | undefined;
      await db.withTransaction(async () => {
        result = await work(db);
      });
      return result as T;
    } finally {
      await db.endSession();
    }
  }
}
