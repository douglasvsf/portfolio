import { HttpStatus, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { erp } from "@portfolio/shared";
import type { ErpSession } from "../common/auth";
import { ErpException, notFound } from "../common/errors";
import { escapeRegex, paginate, toCustomer, toProduct } from "../mappers";
import { Customer, Order, Product, Workspace } from "../schemas";

const tenant = (session: ErpSession) => new Types.ObjectId(session.workspaceId);

/** Produtos e clientes: cadastro por empresa, busca e paginação. */
@Injectable()
export class CatalogService {
  constructor(
    @InjectModel(Product.name) private readonly products: Model<Product>,
    @InjectModel(Customer.name) private readonly customers: Model<Customer>,
    @InjectModel(Order.name) private readonly orders: Model<Order>,
    @InjectModel(Workspace.name) private readonly workspaces: Model<Workspace>,
  ) {}

  private async expiresAt(session: ErpSession) {
    const workspace = await this.workspaces.findById(session.workspaceId).lean();
    if (!workspace) throw new ErpException("unauthorized", "Esta demonstração expirou — entre de novo", HttpStatus.UNAUTHORIZED);
    return workspace.expiresAt;
  }

  // ---- Produtos ---------------------------------------------------------------

  async listProducts(session: ErpSession, query: erp.ProductQuery): Promise<erp.Paginated<erp.Product>> {
    const search = query.search ? { $regex: escapeRegex(query.search), $options: "i" } : undefined;
    const filter = {
      workspaceId: tenant(session),
      active: true,
      ...(search ? { $or: [{ name: search }, { sku: search }, { barcode: query.search }] } : {}),
      ...(query.category ? { category: query.category } : {}),
      ...(query.lowStock ? { $expr: { $lt: ["$stock", "$minStock"] } } : {}),
    };
    const [items, total] = await Promise.all([
      this.products
        .find(filter)
        .sort({ name: 1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean(),
      this.products.countDocuments(filter),
    ]);
    return paginate(items.map(toProduct), total, query);
  }

  async getProduct(session: ErpSession, id: string): Promise<erp.Product> {
    const product = await this.products.findOne({ _id: id, workspaceId: tenant(session) }).lean();
    if (!product) throw notFound("Produto");
    return toProduct(product);
  }

  /** Produto novo começa com estoque zero: saldo só entra por movimentação (fica no histórico). */
  async createProduct(session: ErpSession, input: erp.ProductInput): Promise<erp.Product> {
    const [product] = await this.products.create([{ ...input, workspaceId: tenant(session), stock: 0, expiresAt: await this.expiresAt(session) }]);
    return toProduct(product!.toObject());
  }

  async updateProduct(session: ErpSession, id: string, input: erp.ProductUpdate): Promise<erp.Product> {
    // Código de barras depende da unidade: se só um dos dois mudou, confere com o que está salvo.
    if ((input.barcode !== undefined) !== (input.unit !== undefined)) {
      const current = await this.products.findOne({ _id: id, workspaceId: tenant(session), active: true }).lean();
      if (!current) throw notFound("Produto");
      const check = erp.productUpdateSchema.safeParse({ unit: input.unit ?? current.unit, barcode: input.barcode ?? current.barcode });
      if (!check.success) {
        const issues = check.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }));
        throw new ErpException("validation_error", issues[0]!.message, HttpStatus.BAD_REQUEST, { issues });
      }
    }
    const product = await this.products.findOneAndUpdate({ _id: id, workspaceId: tenant(session), active: true }, { $set: input }, { returnDocument: "after", runValidators: true }).lean();
    if (!product) throw notFound("Produto");
    return toProduct(product);
  }

  /** Desativa em vez de apagar: pedidos antigos e o histórico continuam apontando para ele. */
  async deactivateProduct(session: ErpSession, id: string): Promise<void> {
    const result = await this.products.updateOne({ _id: id, workspaceId: tenant(session), active: true }, { $set: { active: false } });
    if (result.matchedCount === 0) throw notFound("Produto");
  }

  // ---- Clientes ---------------------------------------------------------------

  async listCustomers(session: ErpSession, query: erp.CustomerQuery): Promise<erp.Paginated<erp.Customer>> {
    const search = query.search?.trim();
    const digits = search?.replace(/\D/g, "");
    const filter = {
      workspaceId: tenant(session),
      ...(search
        ? { $or: [{ name: { $regex: escapeRegex(search), $options: "i" } }, ...(digits ? [{ document: { $regex: `^${digits}` } }] : [])] }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.customers
        .find(filter)
        .sort({ name: 1 })
        .skip((query.page - 1) * query.pageSize)
        .limit(query.pageSize)
        .lean(),
      this.customers.countDocuments(filter),
    ]);
    return paginate(items.map(toCustomer), total, query);
  }

  async getCustomer(session: ErpSession, id: string): Promise<erp.Customer> {
    const customer = await this.customers.findOne({ _id: id, workspaceId: tenant(session) }).lean();
    if (!customer) throw notFound("Cliente");
    return toCustomer(customer);
  }

  async createCustomer(session: ErpSession, input: erp.CustomerInput): Promise<erp.Customer> {
    const [customer] = await this.customers.create([{ ...input, workspaceId: tenant(session), expiresAt: await this.expiresAt(session) }]);
    return toCustomer(customer!.toObject());
  }

  async updateCustomer(session: ErpSession, id: string, input: erp.CustomerUpdate): Promise<erp.Customer> {
    const customer = await this.customers.findOneAndUpdate({ _id: id, workspaceId: tenant(session) }, { $set: input }, { returnDocument: "after" }).lean();
    if (!customer) throw notFound("Cliente");
    return toCustomer(customer);
  }

  /** Cliente com pedidos não pode ser excluído — o histórico de vendas depende dele. */
  async deleteCustomer(session: ErpSession, id: string): Promise<void> {
    const workspaceId = tenant(session);
    const hasOrders = await this.orders.exists({ workspaceId, customerId: new Types.ObjectId(id) });
    if (hasOrders) throw new ErpException("invalid_state", "Cliente com pedidos não pode ser excluído", HttpStatus.CONFLICT);
    const result = await this.customers.deleteOne({ _id: id, workspaceId });
    if (result.deletedCount === 0) throw notFound("Cliente");
  }
}
