"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { pay } from "@portfolio/shared";
import { erpRequest, isApiError } from "@/lib/erp/client";
import type { ActionState } from "@/lib/erp/action-state";
import { parseMoneyToCents } from "@/lib/erp/format";
import { clearPaySession, getPaySession, savePaySession } from "./session";

/**
 * Server actions do GODZILLA Pay (BFF). O formulário é validado com o mesmo
 * schema da API antes de sair do servidor do site. Criar cobrança e estornar
 * mandam a Idempotency-Key gerada quando a tela foi montada: clique duplo ou
 * rede instável não criam duas cobranças.
 */

const field = (form: FormData, name: string) => {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
};

const UNAVAILABLE = "Não foi possível falar com a API agora. Tente de novo em instantes.";

/** Erro da API vira mensagem; chave recusada (loja vencida) volta para a entrada. */
async function fail(error: unknown): Promise<Extract<ActionState, { status: "error" }>> {
  if (isApiError(error, "unauthorized")) {
    await clearPaySession();
    redirect("/pay?expirou=1");
  }
  if (isApiError(error, "rate_limited")) return { status: "error", message: "Muitas requisições. Aguarde um pouco e tente de novo." };
  if (isApiError(error) && error.status < 500) return { status: "error", message: error.message };
  return { status: "error", message: UNAVAILABLE };
}

/** Fora de qualquer try: o redirect do Next é uma exceção e não pode ser engolido pelo catch. */
async function apiKey() {
  const session = await getPaySession();
  if (!session) redirect("/pay?expirou=1");
  return session.apiKey;
}

export async function createSandbox(): Promise<ActionState> {
  let sandbox: pay.Sandbox;
  try {
    sandbox = await erpRequest<pay.Sandbox>("/pay/sandboxes", { method: "POST", anonymous: true });
  } catch (error) {
    if (isApiError(error, "rate_limited")) return { status: "error", message: "Você já criou várias lojas na última hora. Tente de novo mais tarde." };
    if (isApiError(error, "demo_full")) return { status: "error", message: "Muitas lojas de teste ativas agora. Tente de novo mais tarde." };
    return { status: "error", message: UNAVAILABLE };
  }
  await savePaySession(sandbox);
  redirect("/pay/cobrancas");
}

export async function leaveSandbox(): Promise<void> {
  await clearPaySession();
  redirect("/pay");
}

export async function createCharge(_: ActionState, form: FormData): Promise<ActionState> {
  const amountCents = parseMoneyToCents(field(form, "amount"));
  const name = field(form, "customerName");
  const document = field(form, "customerDocument");
  const parsed = pay.chargeCreateSchema.safeParse({
    amountCents: Number.isNaN(amountCents) ? undefined : amountCents,
    description: field(form, "description") || undefined,
    expiresIn: Number(field(form, "expiresIn")) || undefined,
    customer: name || document ? { name, document: document || undefined } : undefined,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const path = issue.path.join(".");
      const key = path === "amountCents" ? "amount" : path === "customer.name" ? "customerName" : path === "customer.document" ? "customerDocument" : path;
      fieldErrors[key] ??= key === "amount" ? "Informe um valor entre R$ 0,01 e R$ 100.000,00." : key === "customerName" ? "Nome do pagador muito curto." : issue.message;
    }
    return { status: "error", message: "Confira os campos destacados.", fieldErrors };
  }

  const token = await apiKey();
  let charge: pay.Charge;
  try {
    charge = await erpRequest<pay.Charge>("/pay/charges", { method: "POST", body: parsed.data, token, headers: { "Idempotency-Key": field(form, "idempotencyKey") } });
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/pay/cobrancas");
  redirect(`/pay/cobrancas/${charge.id}`);
}

export async function simulatePayment(id: string): Promise<ActionState> {
  const token = await apiKey();
  try {
    await erpRequest(`/pay/charges/${encodeURIComponent(id)}/simulate-payment`, { method: "POST", token });
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/pay", "layout");
  return { status: "success", message: "Pix confirmado: cobrança paga e webhook enviado." };
}

export async function refundCharge(id: string, _: ActionState, form: FormData): Promise<ActionState> {
  const raw = field(form, "amount");
  const amountCents = raw ? parseMoneyToCents(raw) : undefined;
  const parsed = pay.refundSchema.safeParse({ amountCents: Number.isNaN(amountCents) ? -1 : amountCents });
  if (!parsed.success) return { status: "error", message: "Valor do estorno inválido.", fieldErrors: { amount: "Informe um valor válido ou deixe em branco para estornar tudo." } };
  const token = await apiKey();
  try {
    await erpRequest(`/pay/charges/${encodeURIComponent(id)}/refunds`, { method: "POST", body: parsed.data, token, headers: { "Idempotency-Key": field(form, "idempotencyKey") } });
  } catch (error) {
    return fail(error);
  }
  revalidatePath("/pay", "layout");
  return { status: "success", message: "Estorno feito: lançado no livro-caixa e avisado por webhook." };
}

export async function retryDelivery(id: string): Promise<ActionState> {
  const token = await apiKey();
  try {
    const delivery = await erpRequest<pay.WebhookDelivery>(`/pay/webhooks/deliveries/${encodeURIComponent(id)}/retry`, { method: "POST", token });
    revalidatePath("/pay/webhooks");
    return delivery.status === "delivered" ? { status: "success", message: "Entregue." } : { status: "error", message: delivery.lastError ?? "O destino recusou de novo." };
  } catch (error) {
    return fail(error);
  }
}

export async function saveWebhookSettings(_: ActionState, form: FormData): Promise<ActionState> {
  const destination = field(form, "destination");
  const parsed = pay.webhookSettingsSchema.safeParse({
    url: destination === "url" ? field(form, "url") : null,
    failNext: Number(field(form, "failNext")),
  });
  if (!parsed.success) {
    return { status: "error", message: "Confira os campos destacados.", fieldErrors: { url: "Use uma URL https:// pública (ex.: um endereço do webhook.site)." } };
  }
  const token = await apiKey();
  try {
    await erpRequest("/pay/webhooks/settings", { method: "PATCH", body: parsed.data, token });
  } catch (error) {
    const failed = await fail(error);
    return isApiError(error, "validation_error") ? { ...failed, fieldErrors: { url: error.message } } : failed;
  }
  revalidatePath("/pay/webhooks");
  return { status: "success", message: "Configuração salva." };
}
