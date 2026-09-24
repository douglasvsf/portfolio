import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@godzilla/ui";
import { FREE_TICKERS, hasToken, listStocks, sortFields, type ListedStock, type SortField } from "@/lib/stocks/brapi";
import { getStocksDictionary, type StocksDictionary } from "@/content/stocks";
import { fmt } from "@/i18n/message";
import { getRequestLocale } from "@/i18n/request";
import { createFormatters } from "@/lib/stocks/format";
import { sectorLabel } from "@/lib/stocks/sectors";
import { MarketFilters } from "@/components/stocks/market-filters";
import { MarketTable } from "@/components/stocks/market-table";
import { MoversChart } from "@/components/stocks/movers-chart";
import { SectorChart } from "@/components/stocks/sector-chart";
import { ChangeBadge } from "@/components/stocks/change-badge";

/** Universo usado nos painéis: as ações mais negociadas do dia (evita papéis sem liquidez). */
const LIQUID_UNIVERSE = 100;
const TOP_SECTORS = 5;

function pick(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = getStocksDictionary(await getRequestLocale());
  return { title: { absolute: meta.title }, description: meta.description };
}

export default async function MarketPage({ searchParams }: PageProps<"/stocks">) {
  const params = await searchParams;
  const locale = await getRequestLocale();
  const dict = getStocksDictionary(locale);
  const format = createFormatters(locale);
  const sort = pick(params.sort);
  const query = {
    q: pick(params.q)?.trim() || undefined,
    sector: pick(params.sector) || undefined,
    sortBy: (sortFields as readonly string[]).includes(sort ?? "") ? (sort as SortField) : "volume",
    sortOrder: pick(params.order) === "asc" ? ("asc" as const) : ("desc" as const),
    page: Math.max(1, Number(pick(params.page)) || 1),
  };

  const [table, liquid] = await Promise.all([
    listStocks({ search: query.q, sector: query.sector, sortBy: query.sortBy, sortOrder: query.sortOrder, page: query.page }),
    listStocks({ sortBy: "volume", sortOrder: "desc", limit: LIQUID_UNIVERSE }),
  ]);

  const summary = summarize(liquid.stocks, dict);
  const ofMostTraded = fmt(dict.market.ofMostTraded, { n: liquid.stocks.length });

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <h1 className="text-h2 font-bold tracking-tight">
          {dict.market.title} <span className="text-primary text-glow">B3</span>
        </h1>
        <p className="max-w-2xl text-body text-muted-foreground">
          {fmt(dict.market.subtitle, { n: LIQUID_UNIVERSE })}
        </p>
        {!hasToken && (
          <p className="flex flex-wrap items-center gap-2 text-body-sm text-muted-foreground">
            {dict.market.freeTickers}
            {FREE_TICKERS.map((ticker) => (
              <Link key={ticker} href={`/stocks/acao/${ticker}`}>
                <Badge variant="tag" className="hover:border-primary hover:text-primary">
                  {ticker}
                </Badge>
              </Link>
            ))}
          </p>
        )}
      </section>

      <section aria-label={dict.market.summaryLabel} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label={dict.market.up} value={String(summary.up)} hint={ofMostTraded} tone="success" />
        <StatCard label={dict.market.down} value={String(summary.down)} hint={ofMostTraded} tone="destructive" />
        <StatCard
          label={dict.market.averageChange}
          value={<ChangeBadge value={summary.averageChange} locale={locale} className="text-body-sm" />}
          hint={dict.market.averageChangeHint}
        />
        <StatCard label={dict.market.totalVolume} value={format.compact(summary.totalVolume)} hint={dict.market.totalVolumeHint} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{dict.market.moversTitle}</CardTitle>
            <CardDescription>{dict.market.moversDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <MoversChart data={summary.movers} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{dict.market.sectorsTitle}</CardTitle>
            <CardDescription>{dict.market.sectorsDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <SectorChart data={summary.sectors} />
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-h3 font-semibold">{dict.market.allStocks}</h2>
            <p className="text-body-sm text-muted-foreground">{dict.market.allStocksHint}</p>
          </div>
          <Suspense>
            <MarketFilters sectors={table.availableSectors} />
          </Suspense>
        </div>
        <Card className="p-2">
          <MarketTable data={table} query={query} dict={dict} locale={locale} />
        </Card>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: React.ReactNode;
  hint: string;
  tone?: "success" | "destructive";
}) {
  const color = tone === "success" ? "text-success" : tone === "destructive" ? "text-destructive" : "text-foreground";
  return (
    <Card className="flex flex-col gap-1 p-4">
      <span className="text-overline uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className={`font-mono text-h3 font-semibold tabular-nums ${color}`}>{value}</span>
      <span className="text-caption text-muted-foreground">{hint}</span>
    </Card>
  );
}

function summarize(stocks: ListedStock[], dict: StocksDictionary) {
  const withChange = stocks.filter((stock): stock is ListedStock & { change: number } => stock.change != null);
  const byChange = [...withChange].sort((a, b) => b.change - a.change);

  const gainers = byChange.slice(0, 5);
  const losers = byChange.slice(-5).filter((stock) => !gainers.includes(stock));
  const movers = [...gainers, ...losers].map((stock) => ({ ticker: stock.stock, change: stock.change }));

  const volumeBySector = new Map<string, number>();
  for (const stock of stocks) {
    const label = sectorLabel(stock.sector, dict);
    volumeBySector.set(label, (volumeBySector.get(label) ?? 0) + (stock.volume ?? 0));
  }
  const ranked = [...volumeBySector].sort((a, b) => b[1] - a[1]);
  const others = ranked.slice(TOP_SECTORS).reduce((sum, [, volume]) => sum + volume, 0);
  const sectors = ranked.slice(0, TOP_SECTORS).map(([sector, volume]) => ({ sector, volume }));
  if (others > 0) sectors.push({ sector: dict.market.others, volume: others });

  return {
    up: withChange.filter((stock) => stock.change > 0).length,
    down: withChange.filter((stock) => stock.change < 0).length,
    averageChange: withChange.length ? withChange.reduce((sum, stock) => sum + stock.change, 0) / withChange.length : null,
    totalVolume: stocks.reduce((sum, stock) => sum + (stock.volume ?? 0), 0),
    movers,
    sectors,
  };
}
