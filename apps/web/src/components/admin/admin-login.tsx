"use client";

import { useActionState, useState } from "react";
import { Button, FormField, Input } from "@godzilla/ui";
import { adminLogin, adminSetup, type AdminState } from "@/lib/admin/actions";

const IDLE: AdminState = { status: "idle" };

function ErrorMessage({ state }: { state: AdminState }) {
  if (state.status !== "error") return null;
  return (
    <p role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-body-sm text-destructive">
      {state.message}
    </p>
  );
}

export function AdminLoginForm() {
  const [state, action, pending] = useActionState(adminLogin, IDLE);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormField label="E-mail" required>
        <Input name="email" type="email" autoComplete="username" maxLength={120} />
      </FormField>
      <FormField label="Senha" required>
        <Input name="password" type="password" autoComplete="current-password" maxLength={128} />
      </FormField>
      <ErrorMessage state={state} />
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}

/**
 * Cadastro único do login do painel. Pede a conta de dono atual só para
 * confirmar que é o dono do site quem está criando; some depois de usado.
 */
export function AdminSetupForm() {
  const [state, action, pending] = useActionState(adminSetup, IDLE);
  const [visible, setVisible] = useState(false);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const values = state.status === "error" ? (state.values ?? {}) : {};
  const type = visible ? "text" : "password";
  return (
    <form action={action} className="flex flex-col gap-6" noValidate data-testid="admin-setup">
      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 font-mono text-overline uppercase tracking-widest text-primary">1 · Confirme que é você</legend>
        <FormField label="E-mail da conta de dono atual" required description="A conta com que você entra hoje no ERP. Só confirma quem está criando.">
          <Input name="ownerEmail" type="email" defaultValue={values.ownerEmail} autoComplete="off" maxLength={120} />
        </FormField>
        <FormField label="Senha da conta de dono atual" required>
          <Input name="ownerPassword" type="password" autoComplete="off" maxLength={128} />
        </FormField>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-3 font-mono text-overline uppercase tracking-widest text-primary">2 · Novo login do painel</legend>
        <FormField label="E-mail" error={errors.email} required>
          <Input name="email" type="email" defaultValue={values.email} autoComplete="username" maxLength={120} />
        </FormField>
        <FormField label="Senha" error={errors.password} required description="Pelo menos 10 caracteres. Uma frase longa é mais forte que símbolos.">
          <Input name="password" type={type} autoComplete="new-password" minLength={10} maxLength={128} />
        </FormField>
        <FormField label="Repita a senha" error={errors.confirm} required>
          <Input name="confirm" type={type} autoComplete="new-password" maxLength={128} />
        </FormField>
        <label className="flex w-fit items-center gap-2 text-body-sm text-muted-foreground">
          <input type="checkbox" checked={visible} onChange={(event) => setVisible(event.target.checked)} className="accent-primary" />
          Mostrar senha
        </label>
      </fieldset>

      <ErrorMessage state={state} />
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Criando…" : "Criar login do painel"}
      </Button>
    </form>
  );
}
