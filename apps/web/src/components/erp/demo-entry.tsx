"use client";

import { useActionState } from "react";
import { ArrowRight } from "@godzilla/icons";
import { Button, Spinner } from "@godzilla/ui";
import { IDLE } from "@/lib/erp/action-state";
import { startDemo } from "@/lib/erp/actions";
import { FormMessage } from "./ui";

/** Cria a empresa demo (na API) e entra no dashboard. */
export function DemoEntry() {
  const [state, action, pending] = useActionState(startDemo, IDLE);
  return (
    <form action={action} className="flex flex-col gap-3">
      <Button type="submit" size="lg" disabled={pending} className="w-fit font-mono font-semibold hover:shadow-glow">
        {pending ? <Spinner size="sm" /> : null}
        {pending ? "Criando sua empresa…" : "Entrar na demonstração"}
        {!pending && <ArrowRight aria-hidden="true" />}
      </Button>
      <FormMessage state={state} />
    </form>
  );
}
