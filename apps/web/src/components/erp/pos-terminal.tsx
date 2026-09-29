"use client";

import { useEffect, useMemo, useRef, useState, useTransition, type KeyboardEvent } from "react";
import { Banknote, CheckCircle2, CreditCard, Printer, QrCode, ScanBarcode, Trash2, X } from "@godzilla/icons";
import { Button, Card, FormField, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, cn } from "@godzilla/ui";
import { erp } from "@portfolio/shared";
import { finalizeSale, type SaleState } from "@/lib/erp/actions";
import { money, parseMoneyToCents, parseQuantity, quantity } from "@/lib/erp/format";
import { MAX_LENGTH, maskMoney, maskQuantity, quantityToMasked } from "@/lib/erp/masks";
import { addToCart, barcodeIndex, cartTotals, newSaleKey, paymentSummary, resolveScan, type CartLine } from "@/lib/erp/pos";
import { selectClassName } from "./ui";

const METHOD_ICONS = { pix: QrCode, debit: CreditCard, credit: CreditCard, cash: Banknote } as const;

type Notice = { tone: "info" | "error"; text: string };

/**
 * Frente de caixa. Tudo pelo teclado: o campo de código fica focado, Enter
 * adiciona ("3*código" multiplica, etiqueta da balança traz o peso), F2 volta
 * ao código, F4 vai para o pagamento e F9 finaliza.
 *
 * Cada venda tem uma chave de idempotência. Ela só muda quando a venda muda:
 * clicar de novo em "Finalizar" (ou repetir depois de a rede falhar) manda a
 * mesma chave, e a API devolve a mesma venda em vez de cobrar duas vezes.
 */
export function PosTerminal({ products, customers }: { products: erp.Product[]; customers: erp.Customer[] }) {
  const byId = useMemo(() => new Map(products.map((product) => [product.id, product])), [products]);
  const index = useMemo(() => barcodeIndex(products), [products]);

  const [lines, setLines] = useState<CartLine[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [code, setCode] = useState("");
  const [choices, setChoices] = useState<{ matches: erp.Product[]; multiplier: number } | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [discount, setDiscount] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [payments, setPayments] = useState<erp.Payment[]>([]);
  const [method, setMethod] = useState<erp.PaymentMethod>("pix");
  const [amount, setAmount] = useState("");
  const [saleKey, setSaleKey] = useState(newSaleKey);
  const [failure, setFailure] = useState<Extract<SaleState, { status: "error" }> | null>(null);
  const [done, setDone] = useState<erp.Order | null>(null);
  const [pending, startTransition] = useTransition();

  const codeRef = useRef<HTMLInputElement>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const finishRef = useRef<HTMLButtonElement>(null);

  const discountCents = discount ? parseMoneyToCents(discount) : 0;
  const totals = cartTotals(lines, byId, Number.isFinite(discountCents) ? discountCents : 0);
  const summary = paymentSummary(payments, totals.totalCents);

  /** Qualquer mudança na venda troca a chave (e limpa o erro anterior). */
  const change = (update: () => void) => {
    update();
    setSaleKey(newSaleKey());
    setFailure(null);
  };

  const add = (product: erp.Product, qty: number) => {
    change(() => setLines((current) => addToCart(current, product, qty)));
    setChoices(null);
    setNotice({ tone: "info", text: `${product.name} — ${quantity(product.unit === "un" ? Math.max(1, Math.round(qty)) : qty, product.unit)}` });
  };

  const scan = (input: string) => {
    const outcome = resolveScan(input, products, index);
    if (!outcome) return;
    if (outcome.type === "add") add(outcome.product, outcome.quantity);
    else if (outcome.type === "choose") {
      setChoices(outcome);
      setNotice({ tone: "info", text: `${outcome.matches.length} produtos encontrados — escolha um` });
    } else setNotice({ tone: "error", text: outcome.message });
    setCode("");
    codeRef.current?.focus();
  };

  const addPayment = () => {
    const typed = amount ? parseMoneyToCents(amount) : summary.remainingCents;
    if (!Number.isFinite(typed) || typed <= 0) return;
    change(() => setPayments((current) => [...current, { method, amountCents: typed }]));
    setAmount("");
    const remaining = summary.remainingCents - typed;
    if (remaining <= 0) requestAnimationFrame(() => finishRef.current?.focus());
  };

  const finish = () => {
    if (!summary.complete || pending || lines.length === 0) return;
    const input: erp.PosSaleInput = {
      items: lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
      discountCents: totals.discountCents,
      ...(customerId ? { customerId } : {}),
      payments,
    };
    startTransition(async () => {
      const result = await finalizeSale(input, saleKey);
      if (result.status === "success") setDone(result.order);
      else setFailure(result);
    });
  };

  const newSale = () => {
    setLines([]);
    setDrafts({});
    setPayments([]);
    setDiscount("");
    setCustomerId("");
    setAmount("");
    setMethod("pix");
    setNotice(null);
    setFailure(null);
    setDone(null);
    setSaleKey(newSaleKey());
    requestAnimationFrame(() => codeRef.current?.focus());
  };

  // Atalhos de caixa. Os handlers mudam a cada render; o ref guarda a versão atual.
  const shortcuts = useRef({ finish, newSale, done });
  useEffect(() => {
    shortcuts.current = { finish, newSale, done };
  });
  useEffect(() => {
    const onKey = (event: globalThis.KeyboardEvent) => {
      const keys: Record<string, () => void> = {
        F2: () => (shortcuts.current.done ? shortcuts.current.newSale() : codeRef.current?.focus()),
        F4: () => amountRef.current?.focus(),
        F9: () => shortcuts.current.finish(),
      };
      const action = keys[event.key];
      if (!action) return;
      event.preventDefault();
      action();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (done) return <SaleDone order={done} onNewSale={newSale} />;

  const onCodeKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      if (choices && !code.trim()) add(choices.matches[0]!, choices.multiplier);
      else scan(code);
    }
    if (event.key === "Escape") {
      setChoices(null);
      setCode("");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="flex min-w-0 flex-col gap-4">
        <Card className="flex flex-col gap-3 p-4">
          <label htmlFor="pos-code" className="flex items-center gap-2 font-mono text-overline uppercase tracking-widest text-primary">
            <ScanBarcode className="size-4" aria-hidden="true" /> Código de barras, PLU ou nome
          </label>
          <Input
            id="pos-code"
            ref={codeRef}
            value={code}
            onChange={(event) => setCode(event.target.value.slice(0, 40))}
            onKeyDown={onCodeKey}
            placeholder="Bipe, digite o código ou 3*código — Enter adiciona"
            autoComplete="off"
            autoFocus
            maxLength={40}
            className="h-12 font-mono text-body-lg"
            aria-describedby="pos-notice"
          />
          <p id="pos-notice" role="status" aria-live="polite" className={cn("min-h-5 text-body-sm", notice?.tone === "error" ? "text-destructive" : "text-muted-foreground")}>
            {notice?.text}
          </p>
          {choices && (
            <ul aria-label="Produtos encontrados" className="flex flex-col gap-1">
              {choices.matches.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => add(product, choices.multiplier)}
                    className="flex w-full items-center justify-between gap-3 rounded-md border border-border px-3 py-2 text-left text-body-sm hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <span>{product.name}</span>
                    <span className="font-mono text-caption text-muted-foreground">
                      {money(product.priceCents)}/{erp.UNIT_LABELS[product.unit]}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="w-32">Qtd.</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-10">
                  <span className="sr-only">Remover</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {totals.rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-body-sm text-muted-foreground">
                    Caixa livre. Bipe um produto ou use os códigos de teste abaixo.
                  </TableCell>
                </TableRow>
              ) : (
                totals.rows.map((row) => (
                  <TableRow key={row.productId}>
                    <TableCell>
                      <span className="flex flex-col">
                        <span>{row.product.name}</span>
                        <span className={cn("font-mono text-caption", row.overStock ? "text-warning" : "text-muted-foreground")}>
                          {money(row.product.priceCents)}/{erp.UNIT_LABELS[row.product.unit]}
                          {row.overStock && ` · só ${quantity(row.product.stock, row.product.unit)} em estoque`}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>
                      <Input
                        value={drafts[row.productId] ?? quantityToMasked(row.quantity, row.product.unit)}
                        inputMode={row.product.unit === "un" ? "numeric" : "decimal"}
                        maxLength={MAX_LENGTH.quantity}
                        aria-label={`Quantidade de ${row.product.name} (${erp.UNIT_LABELS[row.product.unit]})`}
                        onChange={(event) => {
                          const text = maskQuantity(event.target.value, row.product.unit);
                          const qty = parseQuantity(text);
                          setDrafts((current) => ({ ...current, [row.productId]: text }));
                          if (Number.isFinite(qty) && qty > 0) {
                            change(() => setLines((current) => current.map((line) => (line.productId === row.productId ? { ...line, quantity: qty } : line))));
                          }
                        }}
                        onBlur={() => setDrafts((current) => Object.fromEntries(Object.entries(current).filter(([id]) => id !== row.productId)))}
                      />
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{money(row.totalCents)}</TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={`Remover ${row.product.name}`}
                        onClick={() => change(() => setLines((current) => current.filter((line) => line.productId !== row.productId)))}
                        className="text-muted-foreground hover:text-destructive"
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

        <TestCodes products={products} onScan={scan} />
      </div>

      <Card className="flex h-fit flex-col gap-4 p-5 lg:sticky lg:top-6">
        <div className="flex items-baseline justify-between border-b border-border pb-3">
          <span className="font-mono text-overline uppercase tracking-widest text-muted-foreground">Total</span>
          <span data-testid="pos-total" className="font-mono text-h2 font-bold tabular-nums text-primary">
            {money(totals.totalCents)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Desconto (R$)" optional>
            <Input
              value={discount}
              onChange={(event) => change(() => setDiscount(maskMoney(event.target.value)))}
              inputMode="numeric"
              placeholder="0,00"
              maxLength={MAX_LENGTH.money}
            />
          </FormField>
          <FormField label="Cliente" optional>
            <select value={customerId} onChange={(event) => change(() => setCustomerId(event.target.value))} className={selectClassName}>
              <option value="">Consumidor final</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-2 text-body-sm font-medium">Pagamento</legend>
          <div className="grid grid-cols-4 gap-2">
            {erp.PAYMENT_METHODS.map((option) => {
              const Icon = METHOD_ICONS[option];
              return (
                <button
                  key={option}
                  type="button"
                  aria-pressed={method === option}
                  onClick={() => setMethod(option)}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-md border px-1 py-2 font-mono text-caption transition-colors",
                    "focus-visible:outline-2 focus-visible:outline-primary",
                    method === option ? "border-primary bg-primary/10 text-primary" : "border-input text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  {erp.PAYMENT_METHOD_LABELS[option]}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <Input
              ref={amountRef}
              value={amount}
              onChange={(event) => setAmount(maskMoney(event.target.value))}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  addPayment();
                }
              }}
              inputMode="numeric"
              placeholder={summary.remainingCents ? maskMoney(String(summary.remainingCents)) : "0,00"}
              maxLength={MAX_LENGTH.money}
              aria-label={`Valor em ${erp.PAYMENT_METHOD_LABELS[method]}`}
              className="font-mono"
            />
            <Button type="button" variant="outline" onClick={addPayment} disabled={totals.totalCents === 0 || (summary.remainingCents === 0 && !amount)}>
              Lançar
            </Button>
          </div>
          {payments.length > 0 && (
            <ul aria-label="Pagamentos lançados" className="flex flex-col gap-1 text-body-sm">
              {payments.map((payment, position) => (
                <li key={position} className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">{erp.PAYMENT_METHOD_LABELS[payment.method]}</span>
                  <span className="ml-auto font-mono tabular-nums">{money(payment.amountCents)}</span>
                  <button
                    type="button"
                    aria-label={`Remover pagamento em ${erp.PAYMENT_METHOD_LABELS[payment.method]}`}
                    onClick={() => change(() => setPayments((current) => current.filter((_, i) => i !== position)))}
                    className="rounded-sm text-muted-foreground hover:text-destructive focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </fieldset>

        <dl className="flex flex-col gap-1 border-t border-border pt-3 text-body-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="font-mono tabular-nums">{money(totals.subtotalCents)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Pago</dt>
            <dd className="font-mono tabular-nums">{money(summary.paidCents)}</dd>
          </div>
          <div className="flex justify-between text-body font-semibold">
            <dt>{summary.changeCents > 0 ? "Troco" : "Falta"}</dt>
            <dd data-testid="pos-balance" className={cn("font-mono tabular-nums", summary.changeCents > 0 && "text-primary")}>
              {money(summary.changeCents > 0 ? summary.changeCents : summary.remainingCents)}
            </dd>
          </div>
        </dl>

        {summary.error && <p className="text-body-sm text-destructive">{summary.error}</p>}
        {failure && (
          <div role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-body-sm">
            <p>{failure.message}</p>
            {failure.shortages && (
              <ul className="mt-1 list-disc pl-5">
                {failure.shortages.map((line) => (
                  <li key={line.productId}>
                    {line.name}: pediu {quantity(line.requested)}, tem {quantity(line.available)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <Button ref={finishRef} type="button" size="lg" onClick={finish} disabled={!summary.complete || pending || lines.length === 0}>
          {pending ? "Finalizando…" : "Finalizar venda (F9)"}
        </Button>
        <p className="font-mono text-caption text-muted-foreground">F2 código · F4 pagamento · F9 finalizar · Esc limpa a busca</p>
      </Card>
    </div>
  );
}

/** Sem leitor de código de barras? Cada botão "bipa" um código de verdade da loja demo. */
function TestCodes({ products, onScan }: { products: erp.Product[]; onScan: (code: string) => void }) {
  const packaged = products.filter((product) => product.unit !== "kg" && product.barcode && product.stock > 0).slice(0, 4);
  const weighed = products.filter((product) => product.unit === "kg" && product.barcode && product.stock > 1.5).slice(0, 2);
  const codes = [
    ...packaged.map((product) => ({ code: product.barcode!, label: product.name })),
    ...weighed.map((product, position) => {
      const grams = position === 0 ? 1250 : 480;
      return { code: erp.buildScaleLabel(product.barcode!, grams), label: `${product.name} · etiqueta ${quantity(grams / 1000, "kg")}` };
    }),
  ];
  if (codes.length === 0) return null;
  return (
    <section aria-labelledby="test-codes" className="flex flex-col gap-2">
      <h2 id="test-codes" className="font-mono text-overline uppercase tracking-widest text-muted-foreground">
        Sem leitor? Clique para bipar
      </h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {codes.map(({ code, label }) => (
          <li key={code}>
            <button
              type="button"
              onClick={() => onScan(code)}
              className="flex w-full flex-col items-start rounded-md border border-dashed border-input px-3 py-2 text-left hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
            >
              <span className="font-mono text-body-sm tracking-wider">{code}</span>
              <span className="text-caption text-muted-foreground">{label}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SaleDone({ order, onNewSale }: { order: erp.Order; onNewSale: () => void }) {
  const newSaleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => newSaleRef.current?.focus(), []);
  return (
    <Card className="mx-auto flex w-full max-w-lg flex-col items-center gap-4 p-8 text-center" role="status">
      <CheckCircle2 className="size-12 text-primary" aria-hidden="true" />
      <h2 className="text-h3 font-bold">Venda #{order.number} concluída</h2>
      <p className="font-mono text-h2 font-bold tabular-nums">{money(order.totalCents)}</p>
      {!!order.changeCents && (
        <p className="rounded-md border border-primary/40 bg-primary/10 px-4 py-2 text-body-lg">
          Troco: <strong className="font-mono tabular-nums text-primary">{money(order.changeCents)}</strong>
        </p>
      )}
      <p className="text-body-sm text-muted-foreground">Estoque baixado e venda registrada. O dashboard já inclui esta venda.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button ref={newSaleRef} onClick={onNewSale}>
          Nova venda (F2)
        </Button>
        <Button asChild variant="outline">
          <a href={`/erp/pdv/cupom/${order.id}`} target="_blank" rel="noopener">
            <Printer aria-hidden="true" /> Imprimir cupom
          </a>
        </Button>
      </div>
    </Card>
  );
}
