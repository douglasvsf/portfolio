"use client";

import { Trash2 } from "@godzilla/icons";
import { Badge, Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, useLocale } from "@godzilla/ui";
import { useStocksDictionary } from "@/content/stocks";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/message";
import { sortTransactions } from "@/lib/portfolio/positions";
import type { Transaction } from "@/lib/portfolio/schema";
import { createFormatters } from "@/lib/stocks/format";

const KIND_VARIANT = { buy: "success", sell: "destructive", bonus: "secondary", merge: "secondary", income: "outline" } as const;

/** Data sem fuso ("2025-03-14") formatada no idioma, sem deslocar o dia. */
export function formatIsoDate(iso: string, locale: Locale) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "short", timeZone: "UTC" }).format(new Date(`${iso}T00:00:00Z`));
}

export function TransactionsTable({ transactions, onRemove }: { transactions: readonly Transaction[]; onRemove: (id: string) => void }) {
  const { transactions: copy } = useStocksDictionary().portfolio;
  const locale = useLocale() as Locale;
  const format = createFormatters(locale);
  const newestFirst = sortTransactions(transactions).reverse();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{copy.date}</TableHead>
          <TableHead>{copy.type}</TableHead>
          <TableHead>{copy.asset}</TableHead>
          <TableHead className="text-right">{copy.quantity}</TableHead>
          <TableHead className="text-right">{copy.price}</TableHead>
          <TableHead className="text-right">{copy.total}</TableHead>
          <TableHead>
            <span className="sr-only">{copy.remove}</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {newestFirst.map((transaction) => {
          const date = formatIsoDate(transaction.date, locale);
          const trade = transaction.kind === "buy" || transaction.kind === "sell";
          const total =
            transaction.kind === "income"
              ? transaction.amount
              : trade
                ? transaction.quantity * transaction.price + (transaction.kind === "buy" ? transaction.fees : -transaction.fees)
                : null;
          return (
            <TableRow key={transaction.id}>
              <TableCell className="font-mono tabular-nums">{date}</TableCell>
              <TableCell>
                <Badge variant={KIND_VARIANT[transaction.kind]}>{copy.kinds[transaction.kind]}</Badge>
              </TableCell>
              <TableCell className="font-mono font-semibold">{transaction.ticker}</TableCell>
              <TableCell className="text-right font-mono tabular-nums">{"quantity" in transaction ? format.quantity(transaction.quantity) : "—"}</TableCell>
              <TableCell className="text-right font-mono tabular-nums">{trade ? format.price(transaction.price) : "—"}</TableCell>
              <TableCell className="text-right font-mono tabular-nums">{format.currency(total)}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(transaction.id)}
                  aria-label={fmt(copy.removeLabel, { ticker: transaction.ticker, date })}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 aria-hidden="true" />
                </Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
