"use server";

import { contact } from "@portfolio/shared";
import { erpRequest, isApiError } from "@/lib/erp/client";

/**
 * Envio do formulário de contato. Valida com o mesmo schema da API, manda pelo
 * servidor do site (o navegador não fala com a API) e devolve só um código do
 * que aconteceu — o texto, em cada idioma, fica com a tela. No erro, devolve
 * também o que foi digitado: o React limpa o formulário depois da action, e
 * ninguém deve perder a mensagem por causa de um campo inválido.
 */
type Field = "name" | "email" | "message";
export type ContactValues = Record<Field | "company", string>;
export type ContactState =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; reason: "invalid" | "rateLimited" | "unavailable"; values: ContactValues; fields?: Field[] };

const text = (form: FormData, name: string) => {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
};

export async function sendContactMessage(_: ContactState, form: FormData): Promise<ContactState> {
  const values: ContactValues = { name: text(form, "name"), email: text(form, "email"), company: text(form, "company"), message: text(form, "message") };
  const parsed = contact.contactMessageSchema.safeParse({
    kind: text(form, "kind"),
    name: values.name,
    email: values.email,
    company: values.company || undefined,
    message: values.message,
    locale: text(form, "locale") || undefined,
    website: text(form, "website") || undefined,
  });
  if (!parsed.success) {
    const fields = [...new Set(parsed.error.issues.map((issue) => String(issue.path[0])))].filter((field): field is Field => ["name", "email", "message"].includes(field));
    return { status: "error", reason: "invalid", values, fields };
  }

  try {
    await erpRequest("/contact", { method: "POST", body: parsed.data, anonymous: true });
  } catch (error) {
    // 429 é o limite por visitante; a caixa cheia (503) cai em "unavailable", que oferece o e-mail.
    if (isApiError(error, "rate_limited") && error.status === 429) return { status: "error", reason: "rateLimited", values };
    if (isApiError(error, "validation_error")) return { status: "error", reason: "invalid", values };
    return { status: "error", reason: "unavailable", values };
  }
  return { status: "success" };
}
