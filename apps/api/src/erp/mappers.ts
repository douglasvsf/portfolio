import type { erp } from "@portfolio/shared";
import type { Customer, Order, Product, StockMovement } from "./schemas";

/** Documento do Mongo → contrato público (@portfolio/shared): ids como string, datas ISO. */

type WithMeta<T> = T & { _id: { toString(): string }; createdAt?: Date; updatedAt?: Date };

const iso = (date: Date | undefined) => (date ?? new Date(0)).toISOString();

export function toProduct(doc: WithMeta<Product>): erp.Product {
  return {
    id: doc._id.toString(),
    sku: doc.sku,
    name: doc.name,
    category: doc.category,
    unit: doc.unit,
    priceCents: doc.priceCents,
    costCents: doc.costCents,
    minStock: doc.minStock,
    stock: doc.stock,
    active: doc.active,
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

export function toCustomer(doc: WithMeta<Customer>): erp.Customer {
  return {
    id: doc._id.toString(),
    name: doc.name,
    document: doc.document,
    ...(doc.email ? { email: doc.email } : {}),
    ...(doc.phone ? { phone: doc.phone } : {}),
    ...(doc.city ? { city: doc.city } : {}),
    createdAt: iso(doc.createdAt),
    updatedAt: iso(doc.updatedAt),
  };
}

export function toMovement(doc: WithMeta<StockMovement>): erp.StockMovement {
  return {
    id: doc._id.toString(),
    productId: doc.productId.toString(),
    productName: doc.productName,
    type: doc.type,
    delta: doc.delta,
    balanceAfter: doc.balanceAfter,
    reason: doc.reason,
    ...(doc.orderId ? { orderId: doc.orderId.toString(), orderNumber: doc.orderNumber } : {}),
    role: doc.role,
    createdAt: iso(doc.createdAt),
  };
}

export function toOrder(doc: WithMeta<Order>): erp.Order {
  return {
    id: doc._id.toString(),
    number: doc.number,
    customer: { id: doc.customerId.toString(), name: doc.customerName },
    items: doc.items.map((item) => ({
      productId: item.productId.toString(),
      sku: item.sku,
      name: item.name,
      unit: item.unit,
      quantity: item.quantity,
      unitPriceCents: item.unitPriceCents,
      totalCents: item.totalCents,
    })),
    subtotalCents: doc.subtotalCents,
    discountCents: doc.discountCents,
    totalCents: doc.totalCents,
    status: doc.status,
    ...(doc.notes ? { notes: doc.notes } : {}),
    createdByRole: doc.createdByRole,
    createdAt: iso(doc.createdAt),
    ...(doc.confirmedAt ? { confirmedAt: doc.confirmedAt.toISOString() } : {}),
    ...(doc.cancelledAt ? { cancelledAt: doc.cancelledAt.toISOString() } : {}),
  };
}

export const paginate = <T>(items: T[], total: number, query: erp.Pagination): erp.Paginated<T> => ({
  items,
  total,
  page: query.page,
  pageSize: query.pageSize,
});

/** Escapa texto do usuário para busca por regex (sem injeção de padrão). */
export const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
