"use client";

import { useActionState, useState } from "react";
import { Button, FormField, Input } from "@godzilla/ui";
import { acceptInvite, changePassword, login, resetPassword, setupOwner } from "@/lib/erp/account-actions";
import { IDLE, type ActionState } from "@/lib/erp/action-state";
import { FormMessage } from "./ui";

/** Formulários de conta. Os limites de tamanho são os mesmos da API. */

const errorsOf = (state: ActionState) => (state.status === "error" ? (state.fieldErrors ?? {}) : {});

/** Senha nova + confirmação, com opção de mostrar o que foi digitado. */
function NewPasswordFields({ errors, name = "password", label = "Senha" }: { errors: Record<string, string>; name?: string; label?: string }) {
  const [visible, setVisible] = useState(false);
  const type = visible ? "text" : "password";
  return (
    <>
      <FormField label={label} error={errors[name]} required description="Pelo menos 10 caracteres. Uma frase longa é mais forte que símbolos.">
        <Input name={name} type={type} autoComplete="new-password" minLength={10} maxLength={128} />
      </FormField>
      <FormField label="Repita a senha" error={errors.confirm} required>
        <Input name="confirm" type={type} autoComplete="new-password" maxLength={128} />
      </FormField>
      <label className="flex w-fit items-center gap-2 text-body-sm text-muted-foreground">
        <input type="checkbox" checked={visible} onChange={(event) => setVisible(event.target.checked)} className="accent-primary" />
        Mostrar senha
      </label>
    </>
  );
}

export function LoginForm() {
  const [state, action, pending] = useActionState(login, IDLE);
  const errors = errorsOf(state);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormField label="E-mail" error={errors.email} required>
        <Input name="email" type="email" autoComplete="username" maxLength={120} />
      </FormField>
      <FormField label="Senha" error={errors.password} required>
        <Input name="password" type="password" autoComplete="current-password" maxLength={128} />
      </FormField>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Entrando…" : "Entrar"}
      </Button>
      <p className="text-caption text-muted-foreground">Esqueceu a senha? Peça ao administrador da sua empresa um link para criar outra.</p>
    </form>
  );
}

export function SetupForm() {
  const [state, action, pending] = useActionState(setupOwner, IDLE);
  const errors = errorsOf(state);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormField label="Token de instalação" error={errors.token} required description="O valor de ERP_SETUP_TOKEN configurado no servidor da API.">
        <Input name="token" type="password" autoComplete="off" maxLength={200} className="font-mono" />
      </FormField>
      <FormField label="Nome da sua empresa" error={errors.companyName} required>
        <Input name="companyName" maxLength={60} />
      </FormField>
      <FormField label="Seu nome" error={errors.name} required>
        <Input name="name" autoComplete="name" maxLength={80} />
      </FormField>
      <FormField label="Seu e-mail (login)" error={errors.email} required>
        <Input name="email" type="email" autoComplete="username" maxLength={120} />
      </FormField>
      <NewPasswordFields errors={errors} />
      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Instalando…" : "Criar minha conta de dono"}
      </Button>
    </form>
  );
}

export function AcceptInviteForm({ token, email }: { token: string; email: string }) {
  const [state, action, pending] = useActionState(acceptInvite.bind(null, token), IDLE);
  const errors = errorsOf(state);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormField label="E-mail (login)">
        <Input value={email} readOnly autoComplete="username" />
      </FormField>
      <FormField label="Seu nome" error={errors.name} required>
        <Input name="name" autoComplete="name" maxLength={80} />
      </FormField>
      <NewPasswordFields errors={errors} label="Crie sua senha" />
      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Criando conta…" : "Criar conta e entrar"}
      </Button>
    </form>
  );
}

export function ResetPasswordForm({ token, email }: { token: string; email: string }) {
  const [state, action, pending] = useActionState(resetPassword.bind(null, token), IDLE);
  const errors = errorsOf(state);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormField label="E-mail (login)">
        <Input value={email} readOnly autoComplete="username" />
      </FormField>
      <NewPasswordFields errors={errors} label="Senha nova" />
      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Salvando…" : "Salvar senha e entrar"}
      </Button>
    </form>
  );
}

export function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePassword, IDLE);
  const errors = errorsOf(state);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate key={state.status === "success" ? state.message : "form"}>
      <FormField label="Senha atual" error={errors.current} required>
        <Input name="current" type="password" autoComplete="current-password" maxLength={128} />
      </FormField>
      <NewPasswordFields errors={errors} name="next" label="Senha nova" />
      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Salvando…" : "Trocar senha"}
      </Button>
    </form>
  );
}
