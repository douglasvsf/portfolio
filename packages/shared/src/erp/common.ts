import { z } from "zod";

/**
 * Contratos do GODZILLA ERP compartilhados entre a API (NestJS) e as telas
 * (Next): o mesmo schema Zod valida a entrada nos dois lados.
 *
 * Dinheiro sempre em centavos (inteiros) — nada de ponto flutuante em preço.
 */

export const objectIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "id inválido");

export const ROLES = ["admin", "seller"] as const;
export const roleSchema = z.enum(ROLES);
export type Role = z.infer<typeof roleSchema>;

export const ROLE_LABELS: Record<Role, string> = { admin: "Administrador", seller: "Vendedor" };

/** Até R$ 10 milhões por valor — suficiente para um mercado e barra abuso. */
export const centsSchema = z.number().int("valor em centavos precisa ser inteiro").min(0).max(1_000_000_000);

/** Quantidade: até 3 casas decimais (1,275 kg) e no máximo 1 milhão. */
export const quantitySchema = z
  .number()
  .positive("quantidade precisa ser maior que zero")
  .max(1_000_000)
  .refine((value) => Math.abs(value * 1000 - Math.round(value * 1000)) < 1e-6, "no máximo 3 casas decimais");

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type Pagination = z.infer<typeof paginationSchema>;

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

/** Formato único de erro da API. */
export const ERROR_CODES = [
  "validation_error",
  "unauthorized",
  "forbidden",
  "not_found",
  "conflict",
  "insufficient_stock",
  "invalid_state",
  "demo_full",
  "rate_limited",
  "internal_error",
] as const;
export type ErrorCode = (typeof ERROR_CODES)[number];

export interface ApiError {
  error: ErrorCode;
  message: string;
  details?: unknown;
}
