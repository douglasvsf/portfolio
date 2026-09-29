"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { erp } from "@portfolio/shared";
import type { z } from "zod";
import type { ActionState } from "./action-state";
import { ErpApiError, erpRequest } from "./client";
import { parseMoneyToCents, parseQuantity } from "./format";
import { clearSession, saveSession } from "./session";

/**
 * Server actions do ERP (BFF). O formulário é validado com o MESMO schema Zod
 * da API (@portfolio/shared) antes de sair do servidor do site; a API valida
 * de novo (nunca confiar no cliente). Erros voltam como estado para a tela.
 */

const text = (form: FormData, name: string) => {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
};
const optional = (form: FormData, name: string) => text(form, name) || undefined;

function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) result[issue.path.join(".") || "_"] ??= issue.message;
  return result;
}

type ErrorState = Extract<ActionState, { status: "error" }>;

/** Converte erros da API em estado de tela; sessão expirada volta para o início. */
async function handle(error: unknown): Promise<ErrorState> {
  if (!(error instanceof ErpApiError)) throw error; // inclui o redirect() do Next
  if (error.code === "unauthorized") {
    await clearSession();
    redirect("/erp?expirou=1");
  }
  const details = error.details as { issues?: { path: string; message: string }[] } | erp.StockShortage[] | undefined;
  if (error.code === "insufficient_stock" && Array.isArray(details)) return { status: "error", message: error.message, shortages: details };
  if (error.code === "validation_error" && details && !Array.isArray(details) && details.issues) {
    return { status: "error", message: error.message, fieldErrors: Object.fromEntries(details.issues.map((issue) => [issue.path, issue.message])) };
  }
  if (error.code === "conflict") {
    const field = (error.details as { field?: string } | undefined)?.field;
    return { status: "error", message: error.message, fieldErrors: field ? { [field]: error.message } : undefined };
  }
  return { status: "error", message: error.message };
}

// ---- Sessão -------------------------------------------------------------------

export async function startDemo(): Promise<ActionState> {
  try {
    await saveSession(await erpRequest<erp.DemoSession>("/erp/sessions/demo", { method: "POST", anonymous: true }));
  } catch (error) {
    return handle(error);
  }
  redirect("/erp/dashboard");
}

export async function switchRole(form: FormData): Promise<void> {
  const parsed = erp.roleSwitchSchema.safeParse({ role: text(form, "role") });
  if (!parsed.success) return;
  try {
    await saveSession(await erpRequest<erp.DemoSession>("/erp/sessions/role", { method: "POST", body: parsed.data }));
  } catch (error) {
    await handle(error);
  }
  revalidatePath("/erp", "layout");
}

export async function leaveDemo(): Promise<void> {
  await clearSession();
  redirect("/erp");
}

// ---- Produtos -----------------------------------------------------------------

export async function saveProduct(_: ActionState, form: FormData): Promise<ActionState> {
  const id = optional(form, "id");
  const input = {
    sku: text(form, "sku"),
    name: text(form, "name"),
    category: text(form, "category"),
    unit: text(form, "unit"),
    priceCents: parseMoneyToCents(text(form, "price")),
    costCents: parseMoneyToCents(text(form, "cost")),
    minStock: parseQuantity(text(form, "minStock")),
    barcode: optional(form, "barcode"),
  };
  const parsed = erp.productInputSchema.safeParse(input);
  if (!parsed.success) return { status: "error", message: "Confira os campos destacados.", fieldErrors: fieldErrors(parsed.error) };

  try {
    if (id) await erpRequest(`/erp/products/${id}`, { method: "PATCH", body: parsed.data });
    else await erpRequest("/erp/products", { method: "POST", body: parsed.data });
  } catch (error) {
    return handle(error);
  }
  revalidatePath("/erp/produtos");
  return { status: "success", message: id ? "Produto atualizado." : "Produto cadastrado — o estoque entra pela tela de Estoque." };
}

export async function deactivateProduct(id: string): Promise<ActionState> {
  try {
    await erpRequest(`/erp/products/${id}`, { method: "DELETE" });
  } catch (error) {
    return handle(error);
  }
  revalidatePath("/erp/produtos");
  return { status: "success", message: "Produto desativado." };
}

// ---- Estoque ------------------------------------------------------------------

export async function registerMovement(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = erp.stockMovementInputSchema.safeParse({
    type: text(form, "type"),
    productId: text(form, "productId"),
    quantity: parseQuantity(text(form, "quantity")),
    reason: text(form, "reason"),
  });
  if (!parsed.success) return { status: "error", message: "Confira os campos destacados.", fieldErrors: fieldErrors(parsed.error) };

  try {
    await erpRequest("/erp/stock/movements", { method: "POST", body: parsed.data });
  } catch (error) {
    return handle(error);
  }
  revalidatePath("/erp", "layout");
  return { status: "success", message: "Movimentação registrada." };
}

// ---- Clientes -----------------------------------------------------------------

export async function saveCustomer(_: ActionState, form: FormData): Promise<ActionState> {
  const id = optional(form, "id");
  const parsed = erp.customerInputSchema.safeParse({
    name: text(form, "name"),
    document: text(form, "document"),
    email: optional(form, "email"),
    phone: optional(form, "phone"),
    city: optional(form, "city"),
  });
  if (!parsed.success) return { status: "error", message: "Confira os campos destacados.", fieldErrors: fieldErrors(parsed.error) };

  try {
    if (id) await erpRequest(`/erp/customers/${id}`, { method: "PATCH", body: parsed.data });
    else await erpRequest("/erp/customers", { method: "POST", body: parsed.data });
  } catch (error) {
    return handle(error);
  }
  revalidatePath("/erp/clientes");
  return { status: "success", message: id ? "Cliente atualizado." : "Cliente cadastrado." };
}

export async function deleteCustomer(id: string): Promise<ActionState> {
  try {
    await erpRequest(`/erp/customers/${id}`, { method: "DELETE" });
  } catch (error) {
    return handle(error);
  }
  revalidatePath("/erp/clientes");
  return { status: "success", message: "Cliente excluído." };
}

// ---- Pedidos ------------------------------------------------------------------

/** O montador de pedido envia os itens em JSON num campo oculto ("payload"). */
export async function createOrder(_: ActionState, form: FormData): Promise<ActionState> {
  let payload: unknown;
  try {
    payload = JSON.parse(text(form, "payload") || "{}");
  } catch {
    return { status: "error", message: "Pedido inválido." };
  }
  const parsed = erp.orderInputSchema.safeParse(payload);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Confira o pedido.", fieldErrors: fieldErrors(parsed.error) };

  let order: erp.Order;
  try {
    order = await erpRequest<erp.Order>("/erp/orders", { method: "POST", body: parsed.data });
  } catch (error) {
    return handle(error);
  }
  revalidatePath("/erp", "layout");
  redirect(`/erp/pedidos/${order.id}?criado=1`);
}

export async function changeOrderStatus(_: ActionState, form: FormData): Promise<ActionState> {
  const id = text(form, "id");
  const action = text(form, "action");
  if (!erp.objectIdSchema.safeParse(id).success || (action !== "confirm" && action !== "cancel")) {
    return { status: "error", message: "Ação inválida." };
  }
  try {
    await erpRequest(`/erp/orders/${id}/${action}`, { method: "POST" });
  } catch (error) {
    return handle(error);
  }
  revalidatePath("/erp", "layout");
  return { status: "success", message: action === "confirm" ? "Pedido confirmado — estoque baixado." : "Pedido cancelado." };
}

// ---- PDV ----------------------------------------------------------------------

export type SaleState = { status: "success"; order: erp.Order } | ErrorState;

/**
 * Finaliza a venda do caixa. A chave de idempotência é gerada no navegador,
 * uma por venda: se a pessoa clicar de novo (ou a rede cair depois de a venda
 * gravar), a API devolve a mesma venda em vez de cobrar e baixar duas vezes.
 */
export async function finalizeSale(input: erp.PosSaleInput, idempotencyKey: string): Promise<SaleState> {
  const parsed = erp.posSaleInputSchema.safeParse(input);
  if (!parsed.success) return { status: "error", message: parsed.error.issues[0]?.message ?? "Confira a venda." };
  if (!erp.idempotencyKeySchema.safeParse(idempotencyKey).success) return { status: "error", message: "Venda inválida — recarregue o caixa." };

  let order: erp.Order;
  try {
    order = await erpRequest<erp.Order>("/erp/pos/sales", { method: "POST", body: parsed.data, headers: { "idempotency-key": idempotencyKey } });
  } catch (error) {
    return handle(error);
  }
  revalidatePath("/erp", "layout");
  return { status: "success", order };
}
