import "server-only";
import { redirect } from "next/navigation";
import type { erp } from "@portfolio/shared";
import type { z } from "zod";
import type { ActionState } from "./action-state";
import { ErpApiError } from "./client";
import { clearSession } from "./session";

/** Apoio das server actions: leitura do formulário e tradução dos erros da API para a tela. */

export const text = (form: FormData, name: string) => {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
};
export const optional = (form: FormData, name: string) => text(form, name) || undefined;
/** Senha: sem trim (espaço conta). */
export const secret = (form: FormData, name: string) => {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
};

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {};
  for (const issue of error.issues) result[issue.path.join(".") || "_"] ??= issue.message;
  return result;
}

export type ErrorState = Extract<ActionState, { status: "error" }>;

/** Converte erros da API em estado de tela; sessão vencida volta para o início. */
export async function handle(error: unknown): Promise<ErrorState> {
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
