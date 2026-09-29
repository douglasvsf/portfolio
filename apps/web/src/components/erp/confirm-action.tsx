"use client";

import { useActionState } from "react";
import type { ReactNode } from "react";
import { Button, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@godzilla/ui";
import { IDLE, type ActionState } from "@/lib/erp/action-state";
import { FormMessage } from "./ui";

/**
 * Ação destrutiva com confirmação (desativar produto, excluir cliente,
 * cancelar pedido). Botões reais, diálogo acessível do Design System.
 */
export function ConfirmAction({
  trigger,
  title,
  description,
  confirmLabel,
  action,
  destructive = true,
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  action: () => Promise<ActionState>;
  destructive?: boolean;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <ConfirmForm action={action} confirmLabel={confirmLabel} destructive={destructive} />
      </DialogContent>
    </Dialog>
  );
}

function ConfirmForm({ action, confirmLabel, destructive }: { action: () => Promise<ActionState>; confirmLabel: string; destructive: boolean }) {
  const [state, run, pending] = useActionState(action, IDLE);
  return (
    <form action={run} className="mt-4 flex flex-col gap-4">
      <FormMessage state={state} />
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="ghost">
            {state.status === "success" ? "Fechar" : "Voltar"}
          </Button>
        </DialogClose>
        {state.status !== "success" && (
          <Button type="submit" variant={destructive ? "destructive" : "default"} disabled={pending}>
            {pending ? "Aguarde…" : confirmLabel}
          </Button>
        )}
      </DialogFooter>
    </form>
  );
}
