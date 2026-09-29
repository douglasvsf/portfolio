"use client";

import { useActionState, useState } from "react";
import { Pencil, Plus } from "@godzilla/icons";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, FormField, Input } from "@godzilla/ui";
import { erp } from "@portfolio/shared";
import { IDLE, type ActionState } from "@/lib/erp/action-state";
import { saveProduct } from "@/lib/erp/actions";
import { MAX_LENGTH, centsToMasked, quantityToMasked } from "@/lib/erp/masks";
import { MaskedInput } from "./masked-input";
import { FormMessage, selectClassName } from "./ui";

/** Cadastro/edição de produto (admin). Preço e custo em reais: "12,90". */
export function ProductDialog({ product }: { product?: erp.Product }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {product ? (
          <Button variant="ghost" size="icon" aria-label={`Editar ${product.name}`}>
            <Pencil aria-hidden="true" />
          </Button>
        ) : (
          <Button>
            <Plus aria-hidden="true" /> Novo produto
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? "Editar produto" : "Novo produto"}</DialogTitle>
          <DialogDescription>{product ? product.sku : "O estoque começa em zero e entra pela tela de Estoque."}</DialogDescription>
        </DialogHeader>
        <ProductForm product={product} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

/** Dentro do DialogContent: remonta a cada abertura (sem erro antigo na tela). */
function ProductForm({ product, onDone }: { product?: erp.Product; onDone: () => void }) {
  const [state, action, pending] = useActionState(async (previous: ActionState, form: FormData) => {
    const result = await saveProduct(previous, form);
    if (result.status === "success") onDone();
    return result;
  }, IDLE);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={action} noValidate className="mt-4 grid gap-4 sm:grid-cols-2">
      {product && <input type="hidden" name="id" value={product.id} />}
      <FormField label="SKU" error={errors.sku} required>
        <MaskedInput mask="sku" name="sku" defaultValue={product?.sku} placeholder="MER-ARR5" maxLength={MAX_LENGTH.sku} className="font-mono uppercase" autoComplete="off" />
      </FormField>
      <FormField label="Nome" error={errors.name} required>
        <Input name="name" defaultValue={product?.name} placeholder="Arroz branco 5 kg" maxLength={MAX_LENGTH.productName} />
      </FormField>
      <FormField label="Categoria" error={errors.category} required>
        <select name="category" defaultValue={product?.category ?? "mercearia"} className={selectClassName}>
          {erp.PRODUCT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {erp.CATEGORY_LABELS[category]}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Unidade" error={errors.unit} required>
        <select name="unit" defaultValue={product?.unit ?? "un"} className={selectClassName}>
          {erp.UNITS.map((unit) => (
            <option key={unit} value={unit}>
              {erp.UNIT_LABELS[unit]}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Preço de venda (R$)" error={errors.priceCents} required>
        <MaskedInput mask="money" name="price" inputMode="numeric" defaultValue={product ? centsToMasked(product.priceCents) : ""} placeholder="0,00" maxLength={MAX_LENGTH.money} />
      </FormField>
      <FormField label="Custo (R$)" error={errors.costCents} required>
        <MaskedInput mask="money" name="cost" inputMode="numeric" defaultValue={product ? centsToMasked(product.costCents) : ""} placeholder="0,00" maxLength={MAX_LENGTH.money} />
      </FormField>
      <FormField
        label="Código de barras"
        error={errors.barcode}
        optional
        description="EAN-13 do produto embalado ou PLU de 5 dígitos da balança (vendido por kg)."
        className="sm:col-span-2"
      >
        <MaskedInput mask="barcode" name="barcode" inputMode="numeric" defaultValue={product?.barcode ?? ""} placeholder="7891234567895" maxLength={MAX_LENGTH.barcode} className="font-mono" autoComplete="off" />
      </FormField>
      <FormField label="Estoque mínimo" error={errors.minStock} required description="Abaixo disso, o produto entra nos alertas.">
        <MaskedInput
          mask="quantity-decimal"
          name="minStock"
          inputMode="decimal"
          defaultValue={product ? quantityToMasked(product.minStock, product.unit) : ""}
          placeholder="10"
          maxLength={MAX_LENGTH.quantity}
        />
      </FormField>
      <div className="sm:col-span-2">
        <FormMessage state={state} />
      </div>
      <DialogFooter className="sm:col-span-2">
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando…" : "Salvar"}
        </Button>
      </DialogFooter>
    </form>
  );
}
