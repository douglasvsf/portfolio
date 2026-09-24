"use client";

import { useMemo, type ReactNode } from "react";
import { Lock, Wallet } from "@godzilla/icons";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Spinner,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  cn,
  useLocale,
} from "@godzilla/ui";
import { useStocksDictionary } from "@/content/stocks";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/message";
import { demoTransactions } from "@/lib/portfolio/demo";
import { computePositions, toSlices, valuePortfolio, type PortfolioSummary } from "@/lib/portfolio/positions";
import { marketOf } from "@/lib/portfolio/schema";
import { usePortfolio } from "@/lib/portfolio/store";
import { createFormatters } from "@/lib/stocks/format";
import { AllocationChart } from "./allocation-chart";
import { BackupMenu } from "./backup-menu";
import { ImportDialog } from "./import-dialog";
import { ClosedPositionsTable, PositionsTable, signedTone } from "./positions-table";
import { TransactionDialog } from "./transaction-dialog";
import { TransactionsTable, formatIsoDate } from "./transactions-table";
import { useMarketData, type CdiPeriod, type MarketData } from "./use-market-data";

export function PortfolioView() {
  const { portfolio: copy } = useStocksDictionary();
  const { transactions, add, remove, importMany, replaceAll } = usePortfolio();

  const positions = useMemo(() => computePositions(transactions ?? []), [transactions]);
  const openTickers = useMemo(() => positions.filter((position) => position.quantity > 0).map((position) => position.ticker), [positions]);
  const firstDate = useMemo(() => positions.reduce<string | null>((first, p) => (first == null || p.firstDate < first ? p.firstDate : first), null), [positions]);
  const market = useMarketData(openTickers, firstDate);
  const valued = useMemo(() => valuePortfolio(positions, market.quotes), [positions, market.quotes]);

  const isDemo = transactions?.some((transaction) => transaction.source === "demo") ?? false;

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-h2 font-bold tracking-tight">
            {copy.title.split(" ").slice(0, -1).join(" ")} <span className="text-primary text-glow">{copy.title.split(" ").at(-1)}</span>
          </h1>
          <p className="max-w-2xl text-body text-muted-foreground">{copy.subtitle}</p>
          <p className="flex items-center gap-2 text-body-sm text-muted-foreground">
            <Lock className="size-(--size-icon-sm) text-primary" aria-hidden="true" />
            {copy.privacy}
          </p>
        </div>
        {transactions && (
          <div className="flex flex-wrap items-center gap-3">
            <TransactionDialog onAdd={add} />
            <ImportDialog onImport={importMany} />
            <BackupMenu transactions={transactions} onRestore={importMany} onClear={() => replaceAll([])} />
          </div>
        )}
      </section>

      {transactions === null ? (
        <LoadingState />
      ) : transactions.length === 0 ? (
        <EmptyState onDemo={() => replaceAll(demoTransactions())} />
      ) : (
        <>
          {isDemo && (
            <div role="note" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-primary/40 bg-primary/5 px-4 py-3 text-body-sm">
              <span>{copy.demoBanner}</span>
              <Button size="sm" variant="outline" onClick={() => replaceAll(transactions.filter((transaction) => transaction.source !== "demo"))}>
                {copy.demoClear}
              </Button>
            </div>
          )}

          <MarketStatus market={market} hasCrypto={openTickers.some((ticker) => marketOf(ticker) === "crypto")} />
          <Summary summary={valued.summary} cdi={market.cdi} loading={market.status === "loading" && !market.updatedAt} />

          {valued.open.length > 0 && <Allocation positions={valued.open} />}

          <Tabs defaultValue="positions" className="flex flex-col gap-4">
            <TabsList className="self-start">
              <TabsTrigger value="positions">{copy.tabs.positions}</TabsTrigger>
              <TabsTrigger value="transactions">{copy.tabs.transactions}</TabsTrigger>
            </TabsList>
            <TabsContent value="positions" className="flex flex-col gap-6">
              {valued.open.length > 0 && (
                <Card>
                  <CardContent className="pt-6">
                    <PositionsTable positions={valued.open} />
                  </CardContent>
                </Card>
              )}
              {valued.closed.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle as="h2" className="text-h4">
                      {copy.positions.closedTitle}
                    </CardTitle>
                    <CardDescription>{copy.positions.closedDescription}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ClosedPositionsTable positions={valued.closed} />
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            <TabsContent value="transactions">
              <Card>
                <CardContent className="pt-6">
                  <TransactionsTable transactions={transactions} onRemove={remove} />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}

function MarketStatus({ market, hasCrypto }: { market: MarketData; hasCrypto: boolean }) {
  const { market: copy } = useStocksDictionary().portfolio;
  const locale = useLocale() as Locale;

  return (
    <div aria-live="polite" className="flex flex-col gap-1 text-body-sm text-muted-foreground">
      {market.status === "loading" && (
        <p className="flex items-center gap-2">
          <Spinner size="sm" /> {copy.loading}
        </p>
      )}
      {market.status === "error" && <p className="text-warning">{copy.error}</p>}
      {market.status === "ready" && market.updatedAt && (
        <p>{fmt(copy.updatedAt, { time: new Intl.DateTimeFormat(locale, { timeStyle: "short" }).format(new Date(market.updatedAt)) })}</p>
      )}
      {market.missing.length > 0 && <p className="text-warning">{fmt(copy.missing, { tickers: market.missing.join(", ") })}</p>}
      {/* Atribuição exigida pelo plano gratuito da CoinGecko. */}
      {hasCrypto && (
        <a href="https://www.coingecko.com/" target="_blank" rel="noopener noreferrer" className="self-start underline-offset-4 hover:text-primary hover:underline">
          {copy.cryptoSource}
        </a>
      )}
    </div>
  );
}

function Summary({ summary, cdi, loading }: { summary: PortfolioSummary; cdi: CdiPeriod | null; loading: boolean }) {
  const { summary: copy } = useStocksDictionary().portfolio;
  const locale = useLocale() as Locale;
  const format = createFormatters(locale);

  return (
    <section aria-label={copy.label} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={copy.marketValue} hint={fmt(copy.marketValueHint, { value: format.currency(summary.cost) })} loading={loading}>
          {format.currency(summary.marketValue)}
        </StatCard>
        <StatCard label={copy.totalReturn} hint={fmt(copy.totalReturnHint, { value: format.currency(summary.bought) })} loading={loading}>
          <span className={signedTone(summary.totalReturn)}>
            {format.currency(summary.totalReturn)} <span className="text-body">({format.percent(summary.totalReturnPercent)})</span>
          </span>
        </StatCard>
        <Card className="flex flex-col gap-2 p-5">
          <dl className="flex flex-col gap-1.5 text-body-sm">
            {[
              [copy.unrealized, summary.unrealized],
              [copy.realized, summary.realized],
              [copy.income, summary.income],
            ].map(([label, value]) => (
              <div key={label as string} className="flex items-baseline justify-between gap-3">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className={cn("font-mono tabular-nums", signedTone(value as number))}>{loading ? <Skeleton className="h-4 w-20" /> : format.currency(value as number)}</dd>
              </div>
            ))}
          </dl>
        </Card>
        <StatCard label={copy.cdi} hint={cdi ? fmt(copy.cdiHint, { date: formatIsoDate(cdi.from, locale) }) : copy.cdiUnavailable} loading={loading}>
          {cdi ? format.percent(cdi.percent) : "—"}
        </StatCard>
      </div>
      <p className="text-caption text-muted-foreground">{copy.disclaimer}</p>
    </section>
  );
}

function StatCard({ label, hint, loading, children }: { label: string; hint: string; loading: boolean; children: ReactNode }) {
  return (
    <Card className="flex flex-col gap-2 p-5">
      <p className="text-body-sm text-muted-foreground">{label}</p>
      <div className="font-mono text-h4 font-semibold tabular-nums">{loading ? <Skeleton className="h-7 w-32" /> : children}</div>
      <p className="text-caption text-muted-foreground">{hint}</p>
    </Card>
  );
}

function Allocation({ positions }: { positions: ReturnType<typeof valuePortfolio>["open"] }) {
  const { charts } = useStocksDictionary().portfolio;
  const byAsset = toSlices(positions, (p) => p.ticker, (p) => p.marketValue);
  const byClass = toSlices(positions, (p) => p.assetClass, (p) => p.marketValue);
  const labels = { ...charts.classes, others: charts.others };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle as="h2" className="text-h4">
            {charts.byAsset}
          </CardTitle>
          <CardDescription>{charts.byAssetDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <AllocationChart data={byAsset} labels={labels} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle as="h2" className="text-h4">
            {charts.byClass}
          </CardTitle>
          <CardDescription>{charts.byClassDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          <AllocationChart data={byClass} labels={labels} />
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState({ onDemo }: { onDemo: () => void }) {
  const { empty } = useStocksDictionary().portfolio;
  return (
    <Card className="flex flex-col items-center gap-4 px-6 py-12 text-center">
      <span className="flex size-12 items-center justify-center rounded-full border border-border bg-background text-primary">
        <Wallet className="size-(--size-icon-md)" aria-hidden="true" />
      </span>
      <h2 className="text-h4 font-semibold">{empty.title}</h2>
      <p className="max-w-lg text-body-sm text-muted-foreground">{empty.description}</p>
      <Button onClick={onDemo}>{empty.demo}</Button>
    </Card>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-28 rounded-lg" />
      ))}
    </div>
  );
}
