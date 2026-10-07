import { Badge } from "@godzilla/ui";
import { pay } from "@portfolio/shared";

/** Peças visuais do GODZILLA Pay (sobre o Design System). */

const CHARGE_VARIANTS: Record<pay.ChargeStatus, "warning" | "success" | "secondary" | "outline"> = {
  pending: "warning",
  paid: "success",
  partially_refunded: "secondary",
  refunded: "secondary",
  expired: "outline",
};

export function ChargeStatusBadge({ status }: { status: pay.ChargeStatus }) {
  return <Badge variant={CHARGE_VARIANTS[status]}>{pay.CHARGE_STATUS_LABELS[status]}</Badge>;
}

const DELIVERY_LABELS: Record<pay.DeliveryStatus, string> = { pending: "Nova tentativa agendada", delivered: "Entregue", failed: "Falhou" };
const DELIVERY_VARIANTS: Record<pay.DeliveryStatus, "warning" | "success" | "destructive"> = { pending: "warning", delivered: "success", failed: "destructive" };

export function DeliveryStatusBadge({ status }: { status: pay.DeliveryStatus }) {
  return <Badge variant={DELIVERY_VARIANTS[status]}>{DELIVERY_LABELS[status]}</Badge>;
}

export const EVENT_LABELS: Record<pay.WebhookEvent, string> = {
  "charge.created": "Cobrança criada",
  "charge.paid": "Cobrança paga",
  "charge.refunded": "Estorno",
  "charge.expired": "Cobrança expirada",
};

export const ACCOUNT_LABELS: Record<string, string> = {
  merchant: "Saldo da loja",
  "platform:pix_settlement": "Liquidação Pix",
  "platform:fees": "Receita de taxas",
};
