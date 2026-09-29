"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { erp } from "@portfolio/shared";
import type { ActionState } from "./action-state";
import { fieldErrors, handle, secret, text, type ErrorState } from "./action-errors";
import { erpRequest, isApiError } from "./client";
import { saveSession } from "./session";

/**
 * Server actions das contas de verdade (acesso por convite). Sem serviço de
 * e-mail: convite e troca de senha viram um link que aparece para quem gerou,
 * que manda para a pessoa (WhatsApp, por exemplo).
 */

/** Resultado de quem gera um link: a tela mostra o link para copiar/enviar. */
export type LinkState = ActionState | { status: "success"; message: string; link: string; expiresAt: string };

type Scope = "team" | "owner";
const base = (scope: Scope) => (scope === "owner" ? "/erp/owner" : "/erp/team");
const refresh = () => {
  revalidatePath("/erp/equipe");
  revalidatePath("/erp/admin");
};

async function siteUrl(path: string) {
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host") ?? "localhost:3000";
  const proto = list.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}${path}`;
}

function samePassword(form: FormData): ErrorState | null {
  return secret(form, "password") === secret(form, "confirm")
    ? null
    : { status: "error", message: "As senhas não conferem.", fieldErrors: { confirm: "repita a mesma senha" } };
}

/** Erro de login/instalação/convite não é "sessão vencida": vira mensagem na própria tela. */
async function publicError(error: unknown): Promise<ErrorState> {
  if (isApiError(error, "unauthorized") || isApiError(error, "forbidden") || isApiError(error, "rate_limited") || isApiError(error, "not_found")) {
    return { status: "error", message: error.message };
  }
  return handle(error);
}

// ---- Entrar -------------------------------------------------------------------------

export async function login(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = erp.loginSchema.safeParse({ email: text(form, "email"), password: secret(form, "password") });
  if (!parsed.success) return { status: "error", message: "Informe e-mail e senha.", fieldErrors: fieldErrors(parsed.error) };
  try {
    await saveSession(await erpRequest<erp.AccountSession>("/erp/auth/login", { method: "POST", body: parsed.data, anonymous: true }));
  } catch (error) {
    return publicError(error);
  }
  redirect("/erp/dashboard");
}

export async function setupOwner(_: ActionState, form: FormData): Promise<ActionState> {
  const mismatch = samePassword(form);
  if (mismatch) return mismatch;
  const parsed = erp.setupSchema.safeParse({
    token: text(form, "token"),
    name: text(form, "name"),
    email: text(form, "email"),
    password: secret(form, "password"),
    companyName: text(form, "companyName"),
  });
  if (!parsed.success) return { status: "error", message: "Confira os campos destacados.", fieldErrors: fieldErrors(parsed.error) };
  try {
    await saveSession(await erpRequest<erp.AccountSession>("/erp/auth/setup", { method: "POST", body: parsed.data, anonymous: true }));
  } catch (error) {
    return publicError(error);
  }
  redirect("/erp/admin");
}

export async function acceptInvite(token: string, _: ActionState, form: FormData): Promise<ActionState> {
  const mismatch = samePassword(form);
  if (mismatch) return mismatch;
  const parsed = erp.acceptInviteSchema.safeParse({ name: text(form, "name"), password: secret(form, "password") });
  if (!parsed.success) return { status: "error", message: "Confira os campos destacados.", fieldErrors: fieldErrors(parsed.error) };
  try {
    const session = await erpRequest<erp.AccountSession>(`/erp/auth/invites/${encodeURIComponent(token)}/accept`, { method: "POST", body: parsed.data, anonymous: true });
    await saveSession(session);
  } catch (error) {
    return publicError(error);
  }
  redirect("/erp/dashboard");
}

export async function resetPassword(token: string, _: ActionState, form: FormData): Promise<ActionState> {
  const mismatch = samePassword(form);
  if (mismatch) return mismatch;
  const parsed = erp.resetPasswordSchema.safeParse({ password: secret(form, "password") });
  if (!parsed.success) return { status: "error", message: "Confira a senha.", fieldErrors: fieldErrors(parsed.error) };
  try {
    await saveSession(await erpRequest<erp.AccountSession>(`/erp/auth/resets/${encodeURIComponent(token)}`, { method: "POST", body: parsed.data, anonymous: true }));
  } catch (error) {
    return publicError(error);
  }
  redirect("/erp/dashboard");
}

export async function changePassword(_: ActionState, form: FormData): Promise<ActionState> {
  if (secret(form, "next") !== secret(form, "confirm")) return { status: "error", message: "As senhas não conferem.", fieldErrors: { confirm: "repita a mesma senha" } };
  const parsed = erp.changePasswordSchema.safeParse({ current: secret(form, "current"), next: secret(form, "next") });
  if (!parsed.success) return { status: "error", message: "Confira os campos destacados.", fieldErrors: fieldErrors(parsed.error) };
  try {
    await saveSession(await erpRequest<erp.AccountSession>("/erp/auth/password", { method: "POST", body: parsed.data }));
  } catch (error) {
    return handle(error);
  }
  return { status: "success", message: "Senha trocada. As outras sessões abertas foram encerradas." };
}

// ---- Equipe e painel do dono ------------------------------------------------------------

export async function createInvite(scope: Scope, _: LinkState, form: FormData): Promise<LinkState> {
  const parsed = erp.inviteCreateSchema.safeParse({
    email: text(form, "email"),
    role: text(form, "role"),
    ...(scope === "owner" ? { workspaceId: text(form, "workspaceId") } : {}),
  });
  if (!parsed.success) return { status: "error", message: "Confira os campos destacados.", fieldErrors: fieldErrors(parsed.error) };
  let link: erp.CreatedLink;
  try {
    link = await erpRequest<erp.CreatedLink>(`${base(scope)}/invites`, { method: "POST", body: parsed.data });
  } catch (error) {
    return handle(error);
  }
  refresh();
  return { status: "success", message: `Convite para ${parsed.data.email} criado.`, link: await siteUrl(`/erp/convite/${link.token}`), expiresAt: link.expiresAt };
}

export async function revokeInvite(scope: Scope, id: string): Promise<ActionState> {
  try {
    await erpRequest(`${base(scope)}/invites/${id}`, { method: "DELETE" });
  } catch (error) {
    return handle(error);
  }
  refresh();
  return { status: "success", message: "Convite cancelado." };
}

export async function updateMember(scope: Scope, id: string, patch: erp.MemberUpdate): Promise<ActionState> {
  const parsed = erp.memberUpdateSchema.safeParse(patch);
  if (!parsed.success) return { status: "error", message: "Alteração inválida." };
  try {
    await erpRequest(`${scope === "owner" ? "/erp/owner/users" : "/erp/team/members"}/${id}`, { method: "PATCH", body: parsed.data });
  } catch (error) {
    return handle(error);
  }
  refresh();
  return { status: "success", message: parsed.data.status === "blocked" ? "Acesso bloqueado — as sessões dessa pessoa caíram agora." : "Acesso atualizado." };
}

export async function createResetLink(scope: Scope, id: string): Promise<LinkState> {
  let link: erp.CreatedLink;
  try {
    link = await erpRequest<erp.CreatedLink>(`${scope === "owner" ? "/erp/owner/users" : "/erp/team/members"}/${id}/reset`, { method: "POST" });
  } catch (error) {
    return handle(error);
  }
  return { status: "success", message: "Link de troca de senha criado (vale 24h, uma vez).", link: await siteUrl(`/erp/redefinir/${link.token}`), expiresAt: link.expiresAt };
}

export async function createCompany(_: ActionState, form: FormData): Promise<ActionState> {
  const parsed = erp.companyCreateSchema.safeParse({ name: text(form, "name") });
  if (!parsed.success) return { status: "error", message: "Confira o nome.", fieldErrors: fieldErrors(parsed.error) };
  try {
    await erpRequest("/erp/owner/companies", { method: "POST", body: parsed.data });
  } catch (error) {
    return handle(error);
  }
  refresh();
  return { status: "success", message: `Empresa ${parsed.data.name} criada. Agora convide o administrador dela.` };
}
