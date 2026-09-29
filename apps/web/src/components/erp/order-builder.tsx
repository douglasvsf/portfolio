"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus, Trash2 } from "@godzilla/icons";
import { Button, Card, FormField, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@godzilla/ui";
import { erp } from "@portfolio/shared";
import { IDLE } from "@/lib/erp/action-state";
import { createOrder } from "@/lib/erp/actions";
import { money, parseMoneyToCents, parseQuantity, quantity } from "@/lib/erp/format";
import { FormMessage, selectClassName } from "./ui";

interface Line {
  productId: string;
  quantity: string;
}

/**
 * Montador de pedido. Os totais aqui são só prévia: a API recalcula com o
 * preço do banco (o preço nunca vem do navegador) e congela no pedido.
 */
export function OrderBuilder({ products, customers }: { products: erp.Product[]; customers: erp.Customer[] }) {
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [lines, setLines] = useState<Line[]>([]);
  const [candidate, setCandidate] = useState(products[0]?.id ?? "");
  const [discount, setDiscount] = useState("");
  const [notes, setNotes] = useState("");
  const [state, action, pending] = useActionState(createOrder, IDLE);

  const byId = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const available = products.filter((product) => !lines.some((line) => line.productId === product.id));
  const rows = lines.map((line) => {
    const product = byId.get(line.productId)!;
    const qty = parseQuantity(line.quantity);
    return { line, product, qty, totalCents: Number.isFinite(qty) ? Math.round(product.priceCents * qty) : 0 };
  });
  const subtotalCents = rows.reduce((sum, row) => sum + row.totalCents, 0);
  const discountCents = discount.trim() ? parseMoneyToCents(discount) : 0;
  const totalCents = subtotalCents - (Number.isFinite(discountCents) ? discountCents : 0);

  const payload = JSON.stringify({
    customerId,
    items: rows.map((row) => ({ productId: row.product.id, quantity: row.qty })),
    discountCents: Number.isFinite(discountCents) ? discountCents : Number.NaN,
    ...(notes.trim() ? { notes: notes.trim() } : {}),
  });

  const addLine = () => {
    const next = candidate || available[0]?.id;
    if (!next) return;
    setLines((current) => [...current, { productId: next, quantity: "1" }]);
    setCandidate(available.find((product) => product.id !== next)?.id ?? "");
  };

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="payload" value={payload} />

      <Card className="grid gap-4 p-5 sm:grid-cols-2">
        <FormField label="Cliente" required>
          <select value={customerId} onChange={(event) => setCustomerId(event.target.value)} className={selectClassName}>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="Adicionar produto">
          <div className="flex gap-2">
            <select value={candidate} onChange={(event) => setCandidate(event.target.value)} className={selectClassName} aria-label="Produto a adicionar">
              {available.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} — {money(product.priceCents)}/{erp.UNIT_LABELS[product.unit]}
                </option>
              ))}
            </select>
            <Button type="button" variant="outline" onClick={addLine} disabled={!available.length}>
              <Plus aria-hidden="true" /> Adicionar
            </Button>
          </div>
        </FormField>
      </Card>

      <Card className="p-2">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead className="w-36">Quantidade</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>
                <span className="sr-only">Remover</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-body-sm text-muted-foreground">
                  Adicione produtos ao pedido.
                </TableCell>
              </TableRow>
            ) : (
              rows.map(({ line, product, qty, totalCents }, index) => (
                <TableRow key={line.productId}>
                  <TableCell>
                    <span className="flex flex-col">
                      <span>{product.name}</span>
                      <span className="text-caption text-muted-foreground">em estoque: {quantity(product.stock, product.unit)}</span>
                    </span>
                  </TableCell>
                  <TableCell>
                    <Input
                      value={line.quantity}
                      inputMode="decimal"
                      aria-label={`Quantidade de ${product.name} (${erp.UNIT_LABELS[product.unit]})`}
                      aria-invalid={!Number.isFinite(qty) || qty <= 0 || (product.unit === "un" && !Number.isInteger(qty)) || undefined}
                      onChange={(event) => setLines((current) => current.map((item, i) => (i === index ? { ...item, quantity: event.target.value } : item)))}
                    />
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-muted-foreground">{money(product.priceCents)}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{money(totalCents)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remover ${product.name}`}
                      onClick={() => setLines((current) => current.filter((_, i) => i !== index))}
                    >
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="grid gap-4 p-5">
          <FormField label="Desconto (R$)" optional>
            <Input value={discount} onChange={(event) => setDiscount(event.target.value)} inputMode="decimal" placeholder="0,00" />
          </FormField>
          <FormField label="Observações" optional>
            <Input value={notes} onChange={(event) => setNotes(event.target.value)} maxLength={280} />
          </FormField>
        </Card>
        <Card className="flex flex-col justify-between gap-4 p-5">
          <dl className="flex flex-col gap-2 text-body-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-mono tabular-nums">{money(subtotalCents)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Desconto</dt>
              <dd className="font-mono tabular-nums">− {money(Number.isFinite(discountCents) ? discountCents : 0)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-h4 font-semibold">
              <dt>Total</dt>
              <dd className="font-mono tabular-nums text-primary">{money(totalCents)}</dd>
            </div>
          </dl>
          <FormMessage state={state} />
          <Button type="submit" size="lg" disabled={pending || rows.length === 0}>
            {pending ? "Criando…" : "Criar pedido (rascunho)"}
          </Button>
          <p className="text-caption text-muted-foreground">Rascunho não mexe no estoque. A baixa acontece ao confirmar.</p>
        </Card>
      </div>
    </form>
  );
}
