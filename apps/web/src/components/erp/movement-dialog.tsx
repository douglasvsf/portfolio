"use client";

import { useActionState, useState } from "react";
import { Plus } from "@godzilla/icons";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, FormField, Input } from "@godzilla/ui";
import { erp } from "@portfolio/shared";
import { IDLE, type ActionState } from "@/lib/erp/action-state";
import { registerMovement } from "@/lib/erp/actions";
import { quantity } from "@/lib/erp/format";
import { MAX_LENGTH, quantityMask } from "@/lib/erp/masks";
import { MaskedInput } from "./masked-input";
import { FormMessage, selectClassName } from "./ui";

type ManualType = "in" | "out" | "adjust";
const HINTS: Record<ManualType, string> = {
  in: "Compra ou recebimento: soma ao saldo.",
  out: "Perda, quebra ou consumo: sai do saldo — nunca abaixo de zero.",
  adjust: "Inventário: a contagem física vira o novo saldo.",
};

/** Movimentação manual de estoque (admin). */
export function MovementDialog({ products }: { products: erp.Product[] }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus aria-hidden="true" /> Nova movimentação
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova movimentação</DialogTitle>
          <DialogDescription>Fica registrada no histórico — movimentações não são editadas nem apagadas.</DialogDescription>
        </DialogHeader>
        <MovementForm products={products} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function MovementForm({ products, onDone }: { products: erp.Product[]; onDone: () => void }) {
  const [type, setType] = useState<ManualType>("in");
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [state, action, pending] = useActionState(async (previous: ActionState, form: FormData) => {
    const result = await registerMovement(previous, form);
    if (result.status === "success") onDone();
    return result;
  }, IDLE);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  const product = products.find((candidate) => candidate.id === productId);

  return (
    <form action={action} noValidate className="mt-4 grid gap-4">
      <FormField label="Tipo" description={HINTS[type]}>
        <select name="type" value={type} onChange={(event) => setType(event.target.value as ManualType)} className={selectClassName}>
          <option value="in">{erp.MOVEMENT_LABELS.in}</option>
          <option value="out">{erp.MOVEMENT_LABELS.out}</option>
          <option value="adjust">{erp.MOVEMENT_LABELS.adjust}</option>
        </select>
      </FormField>
      <FormField label="Produto" error={errors.productId} description={product ? `Saldo atual: ${quantity(product.stock, product.unit)}` : undefined} required>
        <select name="productId" value={productId} onChange={(event) => setProductId(event.target.value)} className={selectClassName}>
          {products.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label={type === "adjust" ? "Saldo contado" : "Quantidade"} error={errors.quantity} required>
        <MaskedInput
          key={product?.unit}
          mask={quantityMask(product?.unit)}
          name="quantity"
          inputMode={product?.unit === "un" ? "numeric" : "decimal"}
          placeholder={product?.unit === "un" ? "10" : "2,5"}
          maxLength={MAX_LENGTH.quantity}
        />
      </FormField>
      <FormField label="Motivo" error={errors.reason} required>
        <Input name="reason" maxLength={MAX_LENGTH.reason} placeholder={type === "in" ? "Compra — fornecedor" : type === "out" ? "Avaria no transporte" : "Inventário mensal"} />
      </FormField>
      <FormMessage state={state} />
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Registrando…" : "Registrar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
