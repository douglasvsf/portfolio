"use client";

import { useActionState } from "react";
import { Button } from "@godzilla/ui";
import type { erp } from "@portfolio/shared";
import { IDLE } from "@/lib/erp/action-state";
import { changeOrderStatus } from "@/lib/erp/actions";
import { FormMessage } from "./ui";

/**
 * Confirmar (baixa o estoque em transação) e cancelar (devolve, se já
 * confirmado). Em falta de estoque, a mensagem lista todos os itens em falta.
 */
export function OrderActions({ order }: { order: erp.Order }) {
  const [state, action, pending] = useActionState(changeOrderStatus, IDLE);
  if (order.status === "cancelled") return <FormMessage state={state} />;

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={order.id} />
      <div className="flex flex-wrap gap-2">
        {order.status === "draft" && (
          <Button type="submit" name="action" value="confirm" disabled={pending}>
            {pending ? "Processando…" : "Confirmar pedido"}
          </Button>
        )}
        <Button type="submit" name="action" value="cancel" variant="outline" disabled={pending} className="hover:border-destructive hover:text-destructive">
          {order.status === "confirmed" ? "Cancelar e devolver estoque" : "Cancelar rascunho"}
        </Button>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
