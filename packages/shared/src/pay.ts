import { z } from "zod";

/**
 * Contratos do GODZILLA Pay — gateway Pix de demonstração. Dinheiro sempre em
 * centavos (inteiros). Cada visitante ganha uma loja de teste (sandbox) com
 * chave de API própria; nada aqui movimenta dinheiro de verdade.
 */

/** Cobrança de R$ 0,01 a R$ 100 mil. */
export const PAY_LIMITS = { minAmount: 1, maxAmount: 10_000_000, description: 140, customerName: 80, minExpiresIn: 60, maxExpiresIn: 86_400 } as const;

/** Taxa por cobrança paga: 0,99% (arredondada para o centavo). Estorno não devolve a taxa. */
export const FEE_BASIS_POINTS = 99;
export const feeFor = (amountCents: number) => Math.round((amountCents * FEE_BASIS_POINTS) / 10_000);

export const CHARGE_STATUSES = ["pending", "paid", "partially_refunded", "refunded", "expired"] as const;
export type ChargeStatus = (typeof CHARGE_STATUSES)[number];
export const CHARGE_STATUS_LABELS: Record<ChargeStatus, string> = {
  pending: "Aguardando pagamento",
  paid: "Paga",
  partially_refunded: "Estornada em parte",
  refunded: "Estornada",
  expired: "Expirada",
};

const amountSchema = z
  .number({ error: "informe o valor em centavos" })
  .int("valor em centavos precisa ser inteiro")
  .min(PAY_LIMITS.minAmount, "valor mínimo de R$ 0,01")
  .max(PAY_LIMITS.maxAmount, "valor máximo de R$ 100.000,00");

/** CPF (11) ou CNPJ (14), só dígitos. */
const documentSchema = z
  .string()
  .transform((value) => value.replace(/\D/g, ""))
  .refine((value) => value.length === 11 || value.length === 14, "CPF ou CNPJ inválido");

export const chargeCreateSchema = z.object({
  amountCents: amountSchema,
  description: z.string().trim().max(PAY_LIMITS.description).optional(),
  /** Validade do Pix em segundos (1 minuto a 24 horas; padrão 1 hora). */
  expiresIn: z.number().int().min(PAY_LIMITS.minExpiresIn).max(PAY_LIMITS.maxExpiresIn).default(3600),
  customer: z.object({ name: z.string().trim().min(2).max(PAY_LIMITS.customerName), document: documentSchema.optional() }).optional(),
});
export type ChargeCreateInput = z.input<typeof chargeCreateSchema>;
export type ChargeCreate = z.output<typeof chargeCreateSchema>;

/** Estorno total (sem valor) ou parcial. */
export const refundSchema = z.object({ amountCents: amountSchema.optional() });
export type RefundInput = z.infer<typeof refundSchema>;

export const chargeListSchema = z.object({
  status: z.enum(CHARGE_STATUSES).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type ChargeListQuery = z.infer<typeof chargeListSchema>;

/** Chave de idempotência (header Idempotency-Key): 8 a 100 caracteres seguros. */
export const idempotencyKeySchema = z.string({ error: "informe o cabeçalho Idempotency-Key" }).regex(/^[A-Za-z0-9_-]{8,100}$/, "Idempotency-Key inválida: use de 8 a 100 letras, números, - ou _");

/** Destino dos webhooks: o inspetor da própria loja (padrão) ou uma URL HTTPS pública. */
export const webhookSettingsSchema = z.object({
  url: z
    .url({ protocol: /^https$/, error: "use uma URL https://" })
    .max(500)
    .nullable()
    .optional(),
  /** Inspetor: quantas das próximas entregas ele recusa (HTTP 500), para ver as novas tentativas acontecendo. */
  failNext: z.number().int().min(0).max(5).optional(),
});
export type WebhookSettingsInput = z.infer<typeof webhookSettingsSchema>;

export const WEBHOOK_EVENTS = ["charge.created", "charge.paid", "charge.refunded", "charge.expired"] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export const DELIVERY_STATUSES = ["pending", "delivered", "failed"] as const;
export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export interface Sandbox {
  id: string;
  name: string;
  /** Aparece uma vez só: a API guarda só o hash. */
  apiKey: string;
  webhookSecret: string;
  pixKey: string;
  expiresAt: string;
}

export interface Merchant {
  id: string;
  name: string;
  apiKeyPrefix: string;
  pixKey: string;
  webhookSecret: string;
  webhookUrl: string | null;
  inspectorFailNext: number;
  expiresAt: string;
}

export interface Charge {
  id: string;
  txid: string;
  status: ChargeStatus;
  amountCents: number;
  feeCents: number;
  refundedCents: number;
  description: string | null;
  customer: { name: string; document: string | null } | null;
  /** Pix copia e cola (BR Code). */
  brCode: string;
  expiresAt: string;
  paidAt: string | null;
  createdAt: string;
}

export interface Balance {
  /** Disponível para estornos (o que a loja tem a receber). */
  availableCents: number;
  /** Totais da loja desde a criação. */
  grossCents: number;
  feesCents: number;
  refundedCents: number;
  /** Conferência do livro-caixa: soma de débitos e créditos de toda a plataforma. */
  ledgerBalanced: boolean;
}

export interface LedgerEntry {
  transactionId: string;
  kind: "payment" | "refund";
  chargeId: string;
  account: string;
  direction: "debit" | "credit";
  amountCents: number;
  createdAt: string;
}

export interface WebhookDelivery {
  id: string;
  eventId: string;
  eventType: WebhookEvent;
  chargeId: string | null;
  url: string;
  status: DeliveryStatus;
  attempts: number;
  nextAttemptAt: string | null;
  lastStatusCode: number | null;
  lastError: string | null;
  deliveredAt: string | null;
  createdAt: string;
  payload: unknown;
  history: { at: string; statusCode: number | null; error: string | null; durationMs: number }[];
}

export interface InspectorRequest {
  id: string;
  receivedAt: string;
  eventType: string;
  headers: Record<string, string>;
  body: string;
  signatureValid: boolean;
  respondedStatus: number;
}
