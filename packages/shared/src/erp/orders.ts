import { z } from "zod";
import type { ProductCategory, Unit } from "./catalog";
import { centsSchema, objectIdSchema, paginationSchema, quantitySchema, type Role } from "./common";

export const ORDER_STATUSES = ["draft", "confirmed", "cancelled"] as const;
export const orderStatusSchema = z.enum(ORDER_STATUSES);
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = { draft: "Rascunho", confirmed: "Confirmado", cancelled: "Cancelado" };

/** Canal de venda: pedido (rascunho → confirmar) ou frente de caixa (venda direta). */
export const ORDER_CHANNELS = ["order", "pos"] as const;
export type OrderChannel = (typeof ORDER_CHANNELS)[number];
export const ORDER_CHANNEL_LABELS: Record<OrderChannel, string> = { order: "Pedido", pos: "PDV" };

export const PAYMENT_METHODS = ["pix", "debit", "credit", "cash"] as const;
export const paymentMethodSchema = z.enum(PAYMENT_METHODS);
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = { pix: "Pix", debit: "Débito", credit: "Crédito", cash: "Dinheiro" };

const itemsSchema = (max: number) =>
  z
    .array(z.object({ productId: objectIdSchema, quantity: quantitySchema }))
    .min(1, "o pedido precisa de pelo menos 1 item")
    .max(max, `no máximo ${max} itens`)
    .refine((items) => new Set(items.map((item) => item.productId)).size === items.length, "produto repetido: ajuste a quantidade do item");

export const orderInputSchema = z.object({
  customerId: objectIdSchema,
  items: itemsSchema(50),
  discountCents: centsSchema.default(0),
  notes: z.string().trim().max(280).optional(),
});
export type OrderInput = z.input<typeof orderInputSchema>;
export type OrderInputParsed = z.output<typeof orderInputSchema>;

/**
 * Venda no PDV: itens, desconto, cliente opcional (consumidor final) e até 4
 * pagamentos. Cartão e Pix não passam do total; só dinheiro gera troco — a
 * API confere os valores contra o total calculado por ela.
 */
export const posSaleInputSchema = z.object({
  items: itemsSchema(100),
  discountCents: centsSchema.default(0),
  customerId: objectIdSchema.optional(),
  payments: z
    .array(z.object({ method: paymentMethodSchema, amountCents: centsSchema.refine((value) => value > 0, "valor precisa ser maior que zero") }))
    .min(1, "informe o pagamento")
    .max(4, "no máximo 4 formas de pagamento"),
});
export type PosSaleInput = z.input<typeof posSaleInputSchema>;
export type PosSaleInputParsed = z.output<typeof posSaleInputSchema>;

/** Chave de idempotência (header Idempotency-Key): repetir a mesma venda não duplica. */
export const idempotencyKeySchema = z.string().regex(/^[A-Za-z0-9-]{16,64}$/, "Idempotency-Key: 16 a 64 letras, números ou hífen");

export interface Payment {
  method: PaymentMethod;
  amountCents: number;
}

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
  channel: OrderChannel;
  /** `null` na venda de balcão sem cliente identificado (consumidor final). */
  customer: { id: string; name: string } | null;
  items: OrderItem[];
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  status: OrderStatus;
  /** Só no PDV. */
  payments?: Payment[];
  changeCents?: number;
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
