import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ChevronsUpDown } from "@godzilla/icons";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, cn } from "@godzilla/ui";
import type { ListParams, QuoteListResponse, SortField } from "@/lib/stocks/brapi";
import type { StocksDictionary } from "@/content/stocks";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/message";
import { createFormatters } from "@/lib/stocks/format";
import { sectorLabel } from "@/lib/stocks/sectors";
import { ChangeBadge } from "./change-badge";
import { StockLogo } from "./stock-logo";

type Query = Required<Pick<ListParams, "sortBy" | "sortOrder" | "page">> & { q?: string; sector?: string };

function href(query: Query, changes: Partial<Query>) {
  const next = { ...query, ...changes };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.sector) params.set("sector", next.sector);
  params.set("sort", next.sortBy);
  params.set("order", next.sortOrder);
  if (next.page > 1) params.set("page", String(next.page));
  return `/stocks?${params.toString()}`;
}

const columns: { field: SortField; label: keyof StocksDictionary["table"]; align?: "right" }[] = [
  { field: "name", label: "asset" },
  { field: "close", label: "price", align: "right" },
  { field: "change", label: "day", align: "right" },
  { field: "volume", label: "volume", align: "right" },
  { field: "market_cap_basic", label: "marketCap", align: "right" },
];

export function MarketTable({ data, query, dict, locale }: { data: QuoteListResponse; query: Query; dict: StocksDictionary; locale: Locale }) {
  const format = createFormatters(locale);
  return (
    <div className="flex flex-col gap-4">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((column) => {
              const active = query.sortBy === column.field;
              const Icon = !active ? ChevronsUpDown : query.sortOrder === "asc" ? ChevronUp : ChevronDown;
              return (
                <TableHead
                  key={column.field}
                  aria-sort={active ? (query.sortOrder === "asc" ? "ascending" : "descending") : undefined}
                  className={cn(column.align === "right" && "text-right")}
                >
                  <Link
                    scroll={false}
                    href={href(query, {
                      sortBy: column.field,
                      sortOrder: active && query.sortOrder === "desc" ? "asc" : "desc",
                      page: 1,
                    })}
                    className={cn("inline-flex items-center gap-1 hover:text-foreground", active && "text-foreground")}
                  >
                    {dict.table[column.label]}
                    <Icon className="size-3.5" aria-hidden="true" />
                  </Link>
                </TableHead>
              );
            })}
            <TableHead className="hidden lg:table-cell">{dict.table.sector}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.stocks.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                {dict.table.empty}
              </TableCell>
            </TableRow>
          )}
          {data.stocks.map((stock) => (
            <TableRow key={stock.stock} className="relative">
              <TableCell>
                <Link href={`/stocks/acao/${stock.stock}`} className="flex items-center gap-3 after:absolute after:inset-0">
                  <StockLogo src={stock.logo} ticker={stock.stock} />
                  <span className="flex flex-col">
                    <span className="font-mono font-semibold">{stock.stock}</span>
                    <span className="max-w-56 truncate text-caption text-muted-foreground">{stock.name}</span>
                  </span>
                </Link>
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums">{format.currency(stock.close)}</TableCell>
              <TableCell className="text-right">
                <ChangeBadge value={stock.change} locale={locale} />
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                {format.compact(stock.volume)}
              </TableCell>
              <TableCell className="text-right font-mono tabular-nums text-muted-foreground">
                {format.compact(stock.market_cap)}
              </TableCell>
              <TableCell className="hidden text-muted-foreground lg:table-cell">{sectorLabel(stock.sector, dict)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <nav aria-label={dict.table.paginationLabel} className="flex items-center justify-between gap-4 text-body-sm text-muted-foreground">
        <span>
          {fmt(dict.table.pagination, {
            total: format.integer(data.totalCount),
            page: data.currentPage,
            pages: Math.max(data.totalPages, 1),
          })}
        </span>
        <div className="flex gap-2">
          <PageLink disabled={data.currentPage <= 1} href={href(query, { page: data.currentPage - 1 })} label={dict.table.previous}>
            <ChevronLeft className="size-(--size-icon-sm)" aria-hidden="true" />
          </PageLink>
          <PageLink disabled={!data.hasNextPage} href={href(query, { page: data.currentPage + 1 })} label={dict.table.next}>
            <ChevronRight className="size-(--size-icon-sm)" aria-hidden="true" />
          </PageLink>
        </div>
      </nav>
    </div>
  );
}

function PageLink({ href, disabled, label, children }: { href: string; disabled: boolean; label: string; children: React.ReactNode }) {
  const classes =
    "inline-flex size-(--size-control-sm) items-center justify-center rounded-md border border-input bg-background text-foreground transition-colors hover:bg-accent hover:text-accent-foreground";
  if (disabled) {
    return (
      <span role="link" aria-disabled="true" aria-label={label} className={cn(classes, "pointer-events-none opacity-50")}>
        {children}
      </span>
    );
  }
  return (
    <Link href={href} scroll={false} aria-label={label} className={classes}>
      {children}
    </Link>
  );
}
