import { z } from "zod";
import type { ProductCategory, Unit } from "./catalog";
import { centsSchema, objectIdSchema, paginationSchema, quantitySchema, type Role } from "./common";

export const ORDER_STATUSES = ["draft", "confirmed", "cancelled"] as const;
export const orderStatusSchema = z.enum(ORDER_STATUSES);
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = { draft: "Rascunho", confirmed: "Confirmado", cancelled: "Cancelado" };

export const orderInputSchema = z.object({
  customerId: objectIdSchema,
  items: z
    .array(z.object({ productId: objectIdSchema, quantity: quantitySchema }))
    .min(1, "o pedido precisa de pelo menos 1 item")
    .max(50, "no máximo 50 itens por pedido")
    .refine((items) => new Set(items.map((item) => item.productId)).size === items.length, "produto repetido: ajuste a quantidade do item"),
  discountCents: centsSchema.default(0),
  notes: z.string().trim().max(280).optional(),
});
export type OrderInput = z.input<typeof orderInputSchema>;
export type OrderInputParsed = z.output<typeof orderInputSchema>;

export const orderQuerySchema = paginationSchema.extend({
  status: orderStatusSchema.optional(),
  customerId: objectIdSchema.optional(),
});
export type OrderQuery = z.infer<typeof orderQuerySchema>;

export interface OrderItem {
  productId: string;
  sku: string;
  name: string;
  unit: Unit;
  quantity: number;
  /** Preço congelado no momento em que o item entrou no pedido. */
  unitPriceCents: number;
  totalCents: number;
}

export interface Order {
  id: string;
  number: number;
  customer: { id: string; name: string };
  items: OrderItem[];
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  status: OrderStatus;
  notes?: string;
  createdByRole: Role;
  createdAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
}

/** Detalhe de estoque insuficiente devolvido pela API ao confirmar. */
export interface StockShortage {
  productId: string;
  name: string;
  requested: number;
  available: number;
}

// ---- Dashboard --------------------------------------------------------------

export interface Dashboard {
  /** Faturamento dos pedidos confirmados nos últimos 6 meses (aaaa-mm). */
  revenueByMonth: { month: string; totalCents: number; orders: number }[];
  currentMonthCents: number;
  averageTicketCents: number;
  ordersByStatus: Record<"draft" | "confirmed" | "cancelled", number>;
  topProducts: { productId: string; name: string; unit: Unit; quantity: number; revenueCents: number }[];
  revenueByCategory: { category: ProductCategory; totalCents: number }[];
  lowStock: { productId: string; name: string; unit: Unit; stock: number; minStock: number }[];
  totals: { products: number; customers: number };
}

// ---- Sessão demo ------------------------------------------------------------

export const roleSwitchSchema = z.object({ role: z.enum(["admin", "seller"]) });

export interface DemoSession {
  token: string;
  role: Role;
  workspace: { id: string; name: string };
  expiresAt: string;
}

export interface Me {
  role: Role;
  workspace: { id: string; name: string; expiresAt: string };
}
