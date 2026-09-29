import { z } from "zod";
import { centsSchema, paginationSchema, quantitySchema, objectIdSchema, type Role } from "./common";
import { isInStoreEan, isPlu, isValidEan } from "./barcode";
import { isValidDocument, onlyDigits } from "./documents";

// ---- Produtos ---------------------------------------------------------------

export const PRODUCT_CATEGORIES = ["hortifruti", "mercearia", "bebidas", "laticinios", "padaria", "carnes", "limpeza", "higiene"] as const;
export const productCategorySchema = z.enum(PRODUCT_CATEGORIES);
export type ProductCategory = z.infer<typeof productCategorySchema>;

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  hortifruti: "Hortifrúti",
  mercearia: "Mercearia",
  bebidas: "Bebidas",
  laticinios: "Laticínios",
  padaria: "Padaria",
  carnes: "Carnes",
  limpeza: "Limpeza",
  higiene: "Higiene",
};

export const UNITS = ["un", "kg", "l"] as const;
export const unitSchema = z.enum(UNITS);
export type Unit = z.infer<typeof unitSchema>;
export const UNIT_LABELS: Record<Unit, string> = { un: "un", kg: "kg", l: "L" };

/**
 * Código de barras: EAN-13/EAN-8 para produto embalado; PLU de 5 dígitos
 * (código da balança) para produto vendido por kg. Opcional.
 */
const barcodeSchema = z
  .string()
  .trim()
  .regex(/^\d{5}$|^\d{8}$|^\d{13}$/, "use EAN-13, EAN-8 ou PLU de 5 dígitos")
  .refine((code) => isPlu(code) || isValidEan(code), "dígito verificador do EAN inválido");

/** Regra que depende de dois campos: vale no cadastro e na edição (quando os dois vêm). */
function checkBarcodeForUnit(value: { unit?: Unit; barcode?: string }, context: z.RefinementCtx) {
  if (!value.barcode || !value.unit) return;
  if (value.unit === "kg" && !isPlu(value.barcode)) {
    context.addIssue({ code: "custom", path: ["barcode"], message: "produto por kg usa o PLU da balança (5 dígitos)" });
  }
  if (value.unit !== "kg" && isPlu(value.barcode)) {
    context.addIssue({ code: "custom", path: ["barcode"], message: "PLU de balança é só para produto vendido por kg" });
  }
  if (isInStoreEan(value.barcode)) {
    context.addIssue({ code: "custom", path: ["barcode"], message: "EAN iniciado em 2 é reservado para etiquetas da balança" });
  }
}

const productFields = z.object({
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{3,20}$/, "SKU: 3 a 20 letras, números ou hífen"),
  name: z.string().trim().min(2, "nome muito curto").max(80),
  category: productCategorySchema,
  unit: unitSchema,
  priceCents: centsSchema.refine((value) => value > 0, "preço precisa ser maior que zero"),
  costCents: centsSchema,
  minStock: z.number().min(0).max(1_000_000),
  barcode: barcodeSchema.optional(),
});

export const productInputSchema = productFields.superRefine(checkBarcodeForUnit);
export type ProductInput = z.infer<typeof productInputSchema>;

export const productUpdateSchema = productFields
  .partial()
  .superRefine(checkBarcodeForUnit)
  .refine((value) => Object.keys(value).length > 0, "nada para atualizar");
export type ProductUpdate = z.infer<typeof productUpdateSchema>;

export const productQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(80).optional(),
  category: productCategorySchema.optional(),
  lowStock: z.enum(["true", "false"]).transform((value) => value === "true").optional(),
});
export type ProductQuery = z.infer<typeof productQuerySchema>;

export interface Product extends ProductInput {
  id: string;
  stock: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// ---- Clientes ---------------------------------------------------------------

export const customerInputSchema = z.object({
  name: z.string().trim().min(2, "nome muito curto").max(100),
  document: z
    .string()
    .transform(onlyDigits)
    .refine(isValidDocument, "CPF ou CNPJ inválido"),
  email: z.email("e-mail inválido").max(120).optional(),
  phone: z
    .string()
    .transform(onlyDigits)
    .refine((value) => value.length === 10 || value.length === 11, "telefone com DDD: 10 ou 11 dígitos")
    .optional(),
  city: z.string().trim().max(60).optional(),
});
export type CustomerInput = z.infer<typeof customerInputSchema>;

export const customerUpdateSchema = customerInputSchema.partial().refine((value) => Object.keys(value).length > 0, "nada para atualizar");
export type CustomerUpdate = z.infer<typeof customerUpdateSchema>;

export const customerQuerySchema = paginationSchema.extend({
  search: z.string().trim().max(80).optional(),
});
export type CustomerQuery = z.infer<typeof customerQuerySchema>;

export interface Customer extends CustomerInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Estoque ----------------------------------------------------------------

/**
 * Movimentações manuais: entrada (compra/recebimento), saída (perda, quebra)
 * e ajuste de inventário (a contagem física vira o novo saldo). Vendas geram
 * movimentações próprias ("sale"/"sale_cancel") a partir dos pedidos.
 */
export const stockMovementInputSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("in"), productId: objectIdSchema, quantity: quantitySchema, reason: z.string().trim().min(3).max(140) }),
  z.object({ type: z.literal("out"), productId: objectIdSchema, quantity: quantitySchema, reason: z.string().trim().min(3).max(140) }),
  z.object({
    type: z.literal("adjust"),
    productId: objectIdSchema,
    /** Saldo contado no inventário (pode ser zero). */
    quantity: z.number().min(0).max(1_000_000),
    reason: z.string().trim().min(3).max(140),
  }),
]);
export type StockMovementInput = z.infer<typeof stockMovementInputSchema>;

export const MOVEMENT_TYPES = ["in", "out", "adjust", "sale", "sale_cancel"] as const;
export type MovementType = (typeof MOVEMENT_TYPES)[number];
export const MOVEMENT_LABELS: Record<MovementType, string> = {
  in: "Entrada",
  out: "Saída",
  adjust: "Ajuste de inventário",
  sale: "Venda",
  sale_cancel: "Cancelamento de venda",
};

export const stockMovementQuerySchema = paginationSchema.extend({
  productId: objectIdSchema.optional(),
  type: z.enum(MOVEMENT_TYPES).optional(),
});
export type StockMovementQuery = z.infer<typeof stockMovementQuerySchema>;

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: MovementType;
  /** Variação com sinal: +10 entrada, −2 saída. */
  delta: number;
  balanceAfter: number;
  reason: string;
  orderId?: string;
  orderNumber?: number;
  role: Role;
  createdAt: string;
}
