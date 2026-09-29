import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import type { erp } from "@portfolio/shared";
import type { ErpSession } from "../common/auth";
import { ErpException } from "../common/errors";
import { Counter, Customer, Order, Product, StockMovement, Workspace } from "../schemas";
import { buildDemoData } from "../seed/supermarket";

/** Uma demo vive 24h; depois o TTL do Mongo apaga a empresa e todos os dados dela. */
export const DEMO_TTL_MS = 24 * 3_600_000;

/**
 * Empresas demo: cada visitante ganha a sua, isolada e já com dados. O limite
 * de empresas ativas protege o banco gratuito (512 MB) contra abuso.
 */
@Injectable()
export class WorkspacesService {
  private readonly logger = new Logger("Workspaces");

  constructor(
    @InjectModel(Workspace.name) private readonly workspaces: Model<Workspace>,
    @InjectModel(Product.name) private readonly products: Model<Product>,
    @InjectModel(Customer.name) private readonly customers: Model<Customer>,
    @InjectModel(Order.name) private readonly orders: Model<Order>,
    @InjectModel(StockMovement.name) private readonly movements: Model<StockMovement>,
    @InjectModel(Counter.name) private readonly counters: Model<Counter>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async createDemo(now = new Date()): Promise<erp.DemoSession> {
    const max = Number(this.config.get("ERP_MAX_WORKSPACES") ?? 300);
    const active = await this.workspaces.countDocuments({ kind: { $ne: "real" }, expiresAt: { $gt: now } });
    if (active >= max) {
      throw new ErpException("demo_full", "A demonstração está cheia agora. Tente de novo mais tarde.", HttpStatus.SERVICE_UNAVAILABLE);
    }

    const expiresAt = new Date(now.getTime() + DEMO_TTL_MS);
    const workspaceId = new Types.ObjectId();
    const name = `Mercado Godzilla #${workspaceId.toString().slice(-4).toUpperCase()}`;
    await this.workspaces.create({ _id: workspaceId, name, kind: "demo", expiresAt });

    try {
      const data = buildDemoData(workspaceId, now, expiresAt);
      // Inserção em lote direto na coleção: datas históricas preservadas (sem timestamps automáticos).
      await Promise.all([
        this.products.collection.insertMany(data.products.map((product) => ({ ...product, createdAt: now, updatedAt: now }))),
        this.customers.collection.insertMany(data.customers.map((customer) => ({ ...customer, createdAt: now, updatedAt: now }))),
        this.orders.collection.insertMany(data.orders),
        this.movements.collection.insertMany(data.movements),
        this.counters.collection.insertOne({ workspaceId, name: "order", value: data.lastOrderNumber, expiresAt }),
      ]);
    } catch (error) {
      // Demo pela metade não serve: limpa o que entrou e devolve erro.
      await this.purge(workspaceId);
      throw error;
    }

    this.logger.log(`Demo criada: ${name}`);
    return this.session({ workspaceId: workspaceId.toString(), role: "admin" }, { id: workspaceId.toString(), name, expiresAt });
  }

  /** Troca de papel na mesma empresa (para ver as permissões mudando). Só na demonstração. */
  async switchRole(current: ErpSession, role: erp.Role): Promise<erp.DemoSession> {
    if (current.userId) throw new ErpException("forbidden", "Troca de papel é só na demonstração", HttpStatus.FORBIDDEN);
    const workspace = await this.find(current.workspaceId);
    return this.session({ workspaceId: current.workspaceId, role }, { id: current.workspaceId, name: workspace.name, expiresAt: workspace.expiresAt! });
  }

  async me(current: ErpSession): Promise<erp.Me> {
    const workspace = await this.find(current.workspaceId);
    return {
      role: current.role,
      workspace: { id: current.workspaceId, name: workspace.name, ...(workspace.expiresAt ? { expiresAt: workspace.expiresAt.toISOString() } : {}) },
    };
  }

  private async find(workspaceId: string) {
    const workspace = await this.workspaces.findById(workspaceId).lean();
    if (!workspace || (workspace.expiresAt && workspace.expiresAt <= new Date())) {
      throw new ErpException("unauthorized", "Esta demonstração expirou — entre de novo", HttpStatus.UNAUTHORIZED);
    }
    return workspace;
  }

  /** O token expira junto com a empresa. */
  private async session(session: ErpSession, workspace: { id: string; name: string; expiresAt: Date }): Promise<erp.DemoSession> {
    const seconds = Math.max(1, Math.floor((workspace.expiresAt.getTime() - Date.now()) / 1000));
    const token = await this.jwt.signAsync({ sub: session.workspaceId, role: session.role }, { expiresIn: seconds });
    return { kind: "demo", token, role: session.role, workspace: { id: workspace.id, name: workspace.name }, expiresAt: workspace.expiresAt.toISOString() };
  }

  private async purge(workspaceId: Types.ObjectId) {
    await Promise.all([
      this.workspaces.deleteOne({ _id: workspaceId }),
      ...[this.products, this.customers, this.orders, this.movements, this.counters].map((model) => model.collection.deleteMany({ workspaceId })),
    ]);
  }
}
