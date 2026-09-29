"use client";

import { useActionState, useState } from "react";
import { Pencil, Plus } from "@godzilla/icons";
import { Button, Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, FormField, Input } from "@godzilla/ui";
import { erp } from "@portfolio/shared";
import { IDLE, type ActionState } from "@/lib/erp/action-state";
import { saveCustomer } from "@/lib/erp/actions";
import { FormMessage } from "./ui";

/** Cadastro/edição de cliente. CPF ou CNPJ validados pelos dígitos verificadores (mesmo schema da API). */
export function CustomerDialog({ customer }: { customer?: erp.Customer }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {customer ? (
          <Button variant="ghost" size="icon" aria-label={`Editar ${customer.name}`}>
            <Pencil aria-hidden="true" />
          </Button>
        ) : (
          <Button>
            <Plus aria-hidden="true" /> Novo cliente
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{customer ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          <DialogDescription>Pessoa física (CPF) ou jurídica (CNPJ) — com ou sem pontuação.</DialogDescription>
        </DialogHeader>
        <CustomerForm customer={customer} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function CustomerForm({ customer, onDone }: { customer?: erp.Customer; onDone: () => void }) {
  const [state, action, pending] = useActionState(async (previous: ActionState, form: FormData) => {
    const result = await saveCustomer(previous, form);
    if (result.status === "success") onDone();
    return result;
  }, IDLE);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={action} noValidate className="mt-4 grid gap-4 sm:grid-cols-2">
      {customer && <input type="hidden" name="id" value={customer.id} />}
      <FormField label="Nome ou razão social" error={errors.name} required className="sm:col-span-2">
        <Input name="name" defaultValue={customer?.name} autoComplete="off" />
      </FormField>
      <FormField label="CPF ou CNPJ" error={errors.document} required>
        <Input name="document" defaultValue={customer ? erp.formatDocument(customer.document) : ""} inputMode="numeric" placeholder="000.000.000-00" />
      </FormField>
      <FormField label="Cidade" error={errors.city} optional>
        <Input name="city" defaultValue={customer?.city} />
      </FormField>
      <FormField label="E-mail" error={errors.email} optional>
        <Input name="email" type="email" defaultValue={customer?.email} />
      </FormField>
      <FormField label="Telefone" error={errors.phone} optional>
        <Input name="phone" inputMode="tel" defaultValue={customer?.phone} placeholder="(44) 99999-0000" />
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
