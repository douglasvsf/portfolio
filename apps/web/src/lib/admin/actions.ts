"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { erp } from "@portfolio/shared";
import { erpRequest, isApiError } from "@/lib/erp/client";
import { clearAdminSession, getAdminSession, saveAdminSession } from "./session";

/**
 * Server actions do painel administrativo do portfólio (/admin). Só o dono do
 * site entra; toda ação é conferida de novo pela API, pelo token.
 */
export type AdminState = { status: "idle" } | { status: "error"; message: string };

const INVALID = "E-mail ou senha inválidos.";
const field = (form: FormData, name: string) => {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
};

export async function adminLogin(_: AdminState, form: FormData): Promise<AdminState> {
  const parsed = erp.loginSchema.safeParse({ email: field(form, "email").trim(), password: field(form, "password") });
  if (!parsed.success) return { status: "error", message: "Informe e-mail e senha." };

  let session: erp.AccountSession;
  try {
    session = await erpRequest<erp.AccountSession>("/erp/auth/login", { method: "POST", body: parsed.data, anonymous: true });
  } catch (error) {
    if (isApiError(error, "rate_limited")) return { status: "error", message: "Muitas tentativas. Aguarde alguns minutos e tente de novo." };
    if (isApiError(error, "unauthorized") || isApiError(error, "forbidden") || isApiError(error, "validation_error")) return { status: "error", message: INVALID };
    return { status: "error", message: "Não consegui falar com o servidor. Tente de novo em instantes." };
  }
  // Conta válida que não é a do dono recebe a mesma resposta de senha errada.
  if (!session.user.isOwner) return { status: "error", message: INVALID };

  await saveAdminSession(session);
  redirect("/admin");
}

export async function adminLogout(): Promise<void> {
  await clearAdminSession();
  redirect("/admin");
}

/** Chamada autenticada do painel; sessão ausente ou recusada devolve ao login. */
async function call(path: string, options: { method: "PATCH" | "DELETE"; body?: unknown }): Promise<AdminState> {
  const session = await getAdminSession();
  if (!session) redirect("/admin");
  try {
    await erpRequest(path, { ...options, token: session.token });
  } catch (error) {
    if (isApiError(error, "unauthorized") || isApiError(error, "forbidden")) {
      await clearAdminSession();
      redirect("/admin");
    }
    if (isApiError(error, "not_found")) return { status: "error", message: "Essa mensagem não existe mais." };
    return { status: "error", message: "Não deu certo agora. Tente de novo em instantes." };
  }
  revalidatePath("/admin");
  return { status: "idle" };
}

export async function setMessageStatus(id: string, status: "new" | "read"): Promise<AdminState> {
  return call(`/admin/messages/${encodeURIComponent(id)}`, { method: "PATCH", body: { status } });
}

export async function deleteMessage(id: string): Promise<AdminState> {
  return call(`/admin/messages/${encodeURIComponent(id)}`, { method: "DELETE" });
}
