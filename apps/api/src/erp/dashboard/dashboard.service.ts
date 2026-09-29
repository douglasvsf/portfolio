import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import type { erp } from "@portfolio/shared";
import type { ErpSession } from "../common/auth";
import { Customer, Order, Product } from "../schemas";

const TIMEZONE = "America/Sao_Paulo";
const MONTHS = 6;

/** Últimos N meses no formato "aaaa-mm", do mais antigo ao atual (fuso de Brasília). */
export function lastMonths(now: Date, count = MONTHS) {
  const [year, month] = new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE, year: "numeric", month: "2-digit" })
    .format(now)
    .split("-")
    .map(Number) as [number, number];
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1 - (count - 1 - index), 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
  });
}

/** Indicadores calculados no próprio banco (aggregation pipeline), não em memória. */
@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Order.name) private readonly orders: Model<Order>,
    @InjectModel(Product.name) private readonly products: Model<Product>,
    @InjectModel(Customer.name) private readonly customers: Model<Customer>,
  ) {}

  async summary(session: ErpSession, now = new Date()): Promise<erp.Dashboard> {
    const workspaceId = new Types.ObjectId(session.workspaceId);
    const months = lastMonths(now);
    const since = new Date(Date.UTC(Number(months[0]!.slice(0, 4)), Number(months[0]!.slice(5)) - 1, 1) - 3 * 3_600_000);
    const confirmed = { workspaceId, status: "confirmed" as const, confirmedAt: { $gte: since } };
    const monthOf = { $dateToString: { format: "%Y-%m", date: "$confirmedAt", timezone: TIMEZONE } };

    const [byMonth, byStatus, top, byCategory, lowStock, productCount, customerCount] = await Promise.all([
      this.orders.aggregate<{ _id: string; totalCents: number; orders: number }>([
        { $match: confirmed },
        { $group: { _id: monthOf, totalCents: { $sum: "$totalCents" }, orders: { $sum: 1 } } },
      ]),
      this.orders.aggregate<{ _id: erp.OrderStatus; count: number }>([{ $match: { workspaceId } }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      this.orders.aggregate<{ _id: Types.ObjectId; name: string; unit: erp.Unit; quantity: number; revenueCents: number }>([
        { $match: confirmed },
        { $unwind: "$items" },
        { $group: { _id: "$items.productId", name: { $first: "$items.name" }, unit: { $first: "$items.unit" }, quantity: { $sum: "$items.quantity" }, revenueCents: { $sum: "$items.totalCents" } } },
        { $sort: { revenueCents: -1 } },
        { $limit: 5 },
      ]),
      this.orders.aggregate<{ _id: erp.ProductCategory; totalCents: number }>([
        { $match: confirmed },
        { $unwind: "$items" },
        { $group: { _id: "$items.category", totalCents: { $sum: "$items.totalCents" } } },
        { $sort: { totalCents: -1 } },
      ]),
      this.products
        .find({ workspaceId, active: true, $expr: { $lt: ["$stock", "$minStock"] } })
        .sort({ stock: 1 })
        .limit(8)
        .lean(),
      this.products.countDocuments({ workspaceId, active: true }),
      this.customers.countDocuments({ workspaceId }),
    ]);

    const revenueByMonth = months.map((month) => {
      const found = byMonth.find((row) => row._id === month);
      return { month, totalCents: found?.totalCents ?? 0, orders: found?.orders ?? 0 };
    });
    const totalRevenue = revenueByMonth.reduce((sum, row) => sum + row.totalCents, 0);
    const totalOrders = revenueByMonth.reduce((sum, row) => sum + row.orders, 0);
    const count = (status: erp.OrderStatus) => byStatus.find((row) => row._id === status)?.count ?? 0;

    return {
      revenueByMonth,
      currentMonthCents: revenueByMonth.at(-1)!.totalCents,
      averageTicketCents: totalOrders ? Math.round(totalRevenue / totalOrders) : 0,
      ordersByStatus: { draft: count("draft"), confirmed: count("confirmed"), cancelled: count("cancelled") },
      topProducts: top.map((row) => ({ productId: row._id.toString(), name: row.name, unit: row.unit, quantity: Math.round(row.quantity * 1000) / 1000, revenueCents: row.revenueCents })),
      revenueByCategory: byCategory.map((row) => ({ category: row._id, totalCents: row.totalCents })),
      lowStock: lowStock.map((product) => ({ productId: product._id.toString(), name: product.name, unit: product.unit, stock: product.stock, minStock: product.minStock })),
      totals: { products: productCount, customers: customerCount },
    };
  }
}
