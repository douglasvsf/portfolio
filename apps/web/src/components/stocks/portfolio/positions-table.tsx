"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { AlertTriangle } from "@godzilla/icons";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, cn, useLocale } from "@godzilla/ui";
import { ChangeBadge } from "@/components/stocks/change-badge";
import { StockLogo } from "@/components/stocks/stock-logo";
import { useStocksDictionary } from "@/content/stocks";
import type { Locale } from "@/i18n/config";
import type { ValuedPosition } from "@/lib/portfolio/positions";
import { marketOf } from "@/lib/portfolio/schema";
import { createFormatters } from "@/lib/stocks/format";

export function signedTone(value: number | null | undefined) {
  if (value == null || value === 0) return "text-muted-foreground";
  return value > 0 ? "text-success" : "text-destructive";
}

export function PositionsTable({ positions }: { positions: ValuedPosition[] }) {
  const { positions: copy } = useStocksDictionary().portfolio;
  const locale = useLocale() as Locale;
  const format = createFormatters(locale);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{copy.asset}</TableHead>
          <TableHead className="text-right">{copy.quantity}</TableHead>
          <TableHead className="text-right">{copy.averagePrice}</TableHead>
          <TableHead className="text-right">{copy.price}</TableHead>
          <TableHead className="text-right">{copy.day}</TableHead>
          <TableHead className="text-right">{copy.value}</TableHead>
          <TableHead className="text-right">{copy.result}</TableHead>
          <TableHead className="text-right">{copy.weight}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {positions.map((position) => (
          <TableRow key={position.ticker}>
            <TableCell>
              <AssetLink ticker={position.ticker}>
                <StockLogo src={position.logo} ticker={position.ticker} />
                <span className="flex flex-col">
                  <span className="flex items-center gap-1.5 font-mono font-semibold group-hover:text-primary">
                    {position.ticker}
                    {position.issues.includes("oversold") && (
                      <span title={copy.oversold}>
                        <AlertTriangle className="size-(--size-icon-sm) text-warning" aria-hidden="true" />
                        <span className="sr-only">{copy.oversold}</span>
                      </span>
                    )}
                  </span>
                  <span className="max-w-48 truncate text-caption text-muted-foreground">{position.name ?? (position.hasQuote ? "" : copy.noQuote)}</span>
                </span>
              </AssetLink>
            </TableCell>
            <TableCell className="text-right font-mono tabular-nums">{format.quantity(position.quantity)}</TableCell>
            <TableCell className="text-right font-mono tabular-nums">{format.price(position.averagePrice)}</TableCell>
            <TableCell className="text-right font-mono tabular-nums">{format.price(position.price)}</TableCell>
            <TableCell className="text-right">
              <ChangeBadge value={position.change} locale={locale} />
            </TableCell>
            <TableCell className="text-right font-mono tabular-nums">{format.currency(position.marketValue)}</TableCell>
            <TableCell className={cn("text-right font-mono tabular-nums", signedTone(position.hasQuote ? position.unrealized : null))}>
              {position.hasQuote ? (
                <span className="flex flex-col items-end">
                  {format.currency(position.unrealized)}
                  <span className="text-caption">{format.percent(position.unrealizedPercent)}</span>
                </span>
              ) : (
                "—"
              )}
            </TableCell>
            <TableCell className="text-right font-mono tabular-nums text-muted-foreground">{format.number(position.weight)}%</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

/** Ações e fundos abrem o detalhe do Kaiju Stocks; cripto não tem página própria. */
function AssetLink({ ticker, children }: { ticker: string; children: ReactNode }) {
  const className = "group flex items-center gap-3";
  if (marketOf(ticker) === "crypto") return <span className={className}>{children}</span>;
  return (
    <Link href={`/stocks/acao/${ticker}`} className={className}>
      {children}
    </Link>
  );
}

/** Ativos vendidos por completo: só o que foi realizado e os proventos. */
export function ClosedPositionsTable({ positions }: { positions: ValuedPosition[] }) {
  const { positions: copy } = useStocksDictionary().portfolio;
  const format = createFormatters(useLocale() as Locale);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{copy.asset}</TableHead>
          <TableHead className="text-right">{copy.realized}</TableHead>
          <TableHead className="text-right">{copy.income}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {positions.map((position) => (
          <TableRow key={position.ticker}>
            <TableCell className="font-mono font-semibold">{position.ticker}</TableCell>
            <TableCell className={cn("text-right font-mono tabular-nums", signedTone(position.realized))}>{format.currency(position.realized)}</TableCell>
            <TableCell className="text-right font-mono tabular-nums">{format.currency(position.income)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
