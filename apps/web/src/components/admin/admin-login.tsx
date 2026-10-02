"use client";

import { useActionState } from "react";
import { Button, FormField, Input } from "@godzilla/ui";
import { adminLogin, type AdminState } from "@/lib/admin/actions";

const IDLE: AdminState = { status: "idle" };

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
      {state.status === "error" && (
        <p role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-body-sm text-destructive">
          {state.message}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}
