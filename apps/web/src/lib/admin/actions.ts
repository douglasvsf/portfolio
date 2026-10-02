"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { admin, erp } from "@portfolio/shared";
import { erpRequest, isApiError } from "@/lib/erp/client";
import { clearAdminSession, getAdminSession, saveAdminSession } from "./session";

/**
 * Server actions do painel administrativo do portfólio (/admin). O painel tem
 * um login só, criado uma única vez; toda ação é conferida de novo pela API,
 * pelo token.
 */
export type AdminState = { status: "idle" } | { status: "error"; message: string; fieldErrors?: Record<string, string>; values?: Record<string, string> };

const INVALID = "E-mail ou senha inválidos.";
const field = (form: FormData, name: string) => {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
};

const UNAVAILABLE = "Não consegui falar com o servidor. Tente de novo em instantes.";
const TOO_MANY = "Muitas tentativas. Aguarde alguns minutos e tente de novo.";

export async function adminLogin(_: AdminState, form: FormData): Promise<AdminState> {
  const parsed = admin.adminLoginSchema.safeParse({ email: field(form, "email").trim(), password: field(form, "password") });
  if (!parsed.success) return { status: "error", message: "Informe e-mail e senha." };

  let session: admin.AdminSession;
  try {
    session = await erpRequest<admin.AdminSession>("/admin/auth/login", { method: "POST", body: parsed.data, anonymous: true });
  } catch (error) {
    if (isApiError(error, "rate_limited")) return { status: "error", message: TOO_MANY };
    if (isApiError(error, "unauthorized") || isApiError(error, "validation_error")) return { status: "error", message: INVALID };
    return { status: "error", message: UNAVAILABLE };
  }
  await saveAdminSession(session);
  redirect("/admin");
}

/**
 * Cadastro único do login do painel. Para ninguém criar antes do dono do
 * site, quem cadastra confirma a conta de dono que já existe; a API só aceita
 * enquanto não houver login nenhum — depois disso esta porta fica fechada.
 */
export async function adminSetup(_: AdminState, form: FormData): Promise<AdminState> {
  // Os e-mails voltam junto com o erro: o React limpa o formulário depois da action.
  const values = { ownerEmail: field(form, "ownerEmail").trim(), email: field(form, "email").trim() };
  const fail = (message: string, fieldErrors?: Record<string, string>): AdminState => ({ status: "error", message, values, ...(fieldErrors ? { fieldErrors } : {}) });
  const owner = erp.loginSchema.safeParse({ email: field(form, "ownerEmail").trim(), password: field(form, "ownerPassword") });
  if (!owner.success) return fail("Informe o e-mail e a senha da sua conta de dono atual.");
  if (field(form, "password") !== field(form, "confirm")) return fail("As senhas não conferem.", { confirm: "Repita a mesma senha." });
  const parsed = admin.adminSetupSchema.safeParse({ email: field(form, "email").trim(), password: field(form, "password") });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.path[0] === "email" ? "Informe um e-mail válido." : "A senha precisa de pelo menos 10 caracteres.";
    return fail("Confira os campos destacados.", fieldErrors);
  }

  let session: admin.AdminSession;
  try {
    const account = await erpRequest<erp.AccountSession>("/erp/auth/login", { method: "POST", body: owner.data, anonymous: true });
    session = await erpRequest<admin.AdminSession>("/admin/auth/setup", { method: "POST", body: parsed.data, token: account.token });
  } catch (error) {
    if (isApiError(error, "rate_limited")) return fail(TOO_MANY);
    if (isApiError(error, "conflict")) return fail("O login do painel já foi criado. Recarregue a página para entrar.");
    // Senha errada e conta que não é a do dono recebem a mesma resposta.
    if (isApiError(error, "unauthorized") || isApiError(error, "forbidden")) return fail("A conta de dono informada não confere.");
    if (isApiError(error, "validation_error")) return fail("Confira os campos e tente de novo.");
    return fail(UNAVAILABLE);
  }
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
