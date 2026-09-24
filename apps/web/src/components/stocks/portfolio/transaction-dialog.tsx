"use client";

import { useState, type FormEvent } from "react";
import { Plus } from "@godzilla/icons";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  FormField,
  Input,
  cn,
  useLocale,
} from "@godzilla/ui";
import { useStocksDictionary } from "@/content/stocks";
import type { Locale } from "@/i18n/config";
import { parseNumber } from "@/lib/portfolio/b3-import";
import { isValidIsoDate, newTransactionId, normalizeAssetCode, type Transaction } from "@/lib/portfolio/schema";
import { createFormatters } from "@/lib/stocks/format";

type FormKind = "buy" | "sell" | "income";

export const selectClassName = cn(
  "h-(--size-control-md) w-full rounded-md border border-input bg-background px-3 text-body-sm text-foreground",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
);

const today = () => new Date().toISOString().slice(0, 10);

interface Errors {
  ticker?: string;
  date?: string;
  quantity?: string;
  price?: string;
  amount?: string;
  fees?: string;
}

/** Formulário de compra, venda ou provento. Aceita "37,20" e "37.20". */
export function TransactionDialog({ onAdd }: { onAdd: (transaction: Transaction) => void }) {
  const { portfolio } = useStocksDictionary();
  const { form, transactions } = portfolio;
  const format = createFormatters(useLocale() as Locale);

  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<FormKind>("buy");
  const [values, setValues] = useState({ ticker: "", date: today(), quantity: "", price: "", amount: "", fees: "" });
  const [errors, setErrors] = useState<Errors>({});

  const set = (field: keyof typeof values) => (event: { target: { value: string } }) => setValues((current) => ({ ...current, [field]: event.target.value }));

  const quantity = parseNumber(values.quantity);
  const price = parseNumber(values.price);
  const fees = values.fees.trim() ? parseNumber(values.fees) : 0;
  const total = kind === "income" ? null : quantity * price + (kind === "buy" ? fees : -fees);

  function reset() {
    setKind("buy");
    setValues({ ticker: "", date: today(), quantity: "", price: "", amount: "", fees: "" });
    setErrors({});
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    const ticker = normalizeAssetCode(values.ticker);
    const amount = parseNumber(values.amount);
    const positive = (value: number) => Number.isFinite(value) && value > 0;

    const next: Errors = {
      ticker: ticker ? undefined : form.tickerInvalid,
      date: isValidIsoDate(values.date) && values.date <= today() ? undefined : form.dateInvalid,
      ...(kind === "income"
        ? { amount: positive(amount) ? undefined : form.positive }
        : {
            quantity: positive(quantity) ? undefined : form.positive,
            price: positive(price) ? undefined : form.positive,
            fees: Number.isFinite(fees) && fees >= 0 ? undefined : form.positive,
          }),
    };
    setErrors(next);
    if (Object.values(next).some(Boolean) || !ticker) return;

    const base = { id: newTransactionId(), ticker, date: values.date, source: "manual" as const };
    onAdd(kind === "income" ? { ...base, kind, amount } : { ...base, kind, quantity, price, fees });
    setOpen(false);
    reset();
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus aria-hidden="true" />
          {portfolio.actions.add}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{form.title}</DialogTitle>
          <DialogDescription>{form.description}</DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
          <FormField label={form.kind} className="sm:col-span-2">
            <select value={kind} onChange={(event) => setKind(event.target.value as FormKind)} className={selectClassName}>
              <option value="buy">{transactions.kinds.buy}</option>
              <option value="sell">{transactions.kinds.sell}</option>
              <option value="income">{transactions.kinds.income}</option>
            </select>
          </FormField>
          <FormField label={form.ticker} description={form.tickerHint} error={errors.ticker} required>
            <Input
              value={values.ticker}
              onChange={set("ticker")}
              placeholder={form.tickerPlaceholder}
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              className="font-mono uppercase"
            />
          </FormField>
          <FormField label={form.date} error={errors.date} required>
            <Input type="date" value={values.date} max={today()} onChange={set("date")} />
          </FormField>

          {kind === "income" ? (
            <FormField label={form.amount} error={errors.amount} required className="sm:col-span-2">
              <Input inputMode="decimal" value={values.amount} onChange={set("amount")} placeholder="0,00" />
            </FormField>
          ) : (
            <>
              <FormField label={form.quantity} error={errors.quantity} required>
                <Input inputMode="decimal" value={values.quantity} onChange={set("quantity")} placeholder="100" />
              </FormField>
              <FormField label={form.price} error={errors.price} required>
                <Input inputMode="decimal" value={values.price} onChange={set("price")} placeholder="0,00" />
              </FormField>
              <FormField label={form.fees} error={errors.fees} optional className="sm:col-span-2">
                <Input inputMode="decimal" value={values.fees} onChange={set("fees")} placeholder="0,00" />
              </FormField>
              <p className="flex items-baseline justify-between rounded-md border border-border bg-card px-3 py-2 text-body-sm sm:col-span-2" aria-live="polite">
                <span className="text-muted-foreground">{form.total}</span>
                <span className="font-mono tabular-nums">{total != null && Number.isFinite(total) ? format.currency(total) : "—"}</span>
              </p>
            </>
          )}

          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {form.cancel}
            </Button>
            <Button type="submit">{form.submit}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
