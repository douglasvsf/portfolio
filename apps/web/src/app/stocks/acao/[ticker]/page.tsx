import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, ArrowLeft } from "@godzilla/icons";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  cn,
} from "@godzilla/ui";
import { BrapiError, FREE_TICKERS, availableRanges, getQuote, isRange, ranges, type HistoricalPrice, type Range } from "@/lib/stocks/brapi";
import { getStocksDictionary, type StocksDictionary } from "@/content/stocks";
import { fmt } from "@/i18n/message";
import { getRequestLocale } from "@/i18n/request";
import { createFormatters } from "@/lib/stocks/format";
import { ChangeBadge } from "@/components/stocks/change-badge";
import { StockLogo } from "@/components/stocks/stock-logo";
import { PriceChart, VolumeChart, type PricePoint } from "@/components/stocks/price-chart";

const HISTORY_ROWS = 15;
const TICKER_PATTERN = /^[A-Z0-9]{4,8}$/;

export async function generateMetadata({ params }: PageProps<"/stocks/acao/[ticker]">): Promise<Metadata> {
  const { ticker } = await params;
  return { title: ticker.toUpperCase() };
}

export default async function StockPage({ params, searchParams }: PageProps<"/stocks/acao/[ticker]">) {
  const ticker = (await params).ticker.toUpperCase();
  if (!TICKER_PATTERN.test(ticker)) notFound();

  const locale = await getRequestLocale();
  const dict = getStocksDictionary(locale);
  const format = createFormatters(locale);

  const rangeParam = (await searchParams).range;
  const allowed = availableRanges(ticker);
  // Período fora do plano (ex.: ?range=5y numa ação paga) cai para 3 meses.
  const range: Range = isRange(rangeParam) && allowed.includes(rangeParam) ? rangeParam : "3mo";

  let quote;
  try {
    quote = await getQuote(ticker, range);
  } catch (error) {
    if (error instanceof BrapiError && error.status === 404) notFound();
    return <QuoteUnavailable ticker={ticker} error={error} dict={dict} />;
  }

  const history = (quote.historicalDataPrice ?? []).filter(
    (point): point is HistoricalPrice & { close: number } => point.close != null,
  );
  const monthly = ranges[range].interval === "1mo";
  const points: PricePoint[] = history.map((point) => ({
    label: format.date(point.date, monthly ? { month: "2-digit", year: "2-digit" } : { day: "2-digit", month: "2-digit" }),
    date: format.date(point.date, monthly ? { month: "long", year: "numeric" } : { dateStyle: "medium" }),
    close: point.close,
    volume: point.volume ?? 0,
  }));

  const first = history[0]?.close;
  const periodChange = first ? ((quote.regularMarketPrice - first) / first) * 100 : null;
  const closes = history.map((point) => point.close);

  const stats = [
    { label: dict.detail.open, value: format.currency(quote.regularMarketOpen) },
    { label: dict.detail.previousClose, value: format.currency(quote.regularMarketPreviousClose) },
    { label: dict.detail.dayRange, value: `${format.number(quote.regularMarketDayLow)} – ${format.number(quote.regularMarketDayHigh)}` },
    { label: dict.detail.yearRange, value: `${format.number(quote.fiftyTwoWeekLow)} – ${format.number(quote.fiftyTwoWeekHigh)}` },
    { label: dict.detail.volume, value: format.compact(quote.regularMarketVolume) },
    { label: dict.detail.marketCap, value: format.compact(quote.marketCap) },
    { label: dict.detail.pe, value: format.number(quote.priceEarnings) },
    { label: dict.detail.eps, value: format.currency(quote.earningsPerShare) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <BackLink label={dict.detail.back} />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-4">
          <StockLogo src={quote.logourl} ticker={ticker} size={56} className="rounded-lg" />
          <div>
            <h1 className="font-mono text-h2 font-bold tracking-tight">{quote.symbol}</h1>
            <p className="text-body-sm text-muted-foreground">{quote.longName}</p>
          </div>
        </div>
        <div className="flex flex-col items-start gap-1 sm:items-end">
          <div className="flex items-center gap-3">
            <span className="font-mono text-h2 font-bold tabular-nums">{format.currency(quote.regularMarketPrice)}</span>
            <ChangeBadge value={quote.regularMarketChangePercent} locale={locale} className="text-body-sm" />
          </div>
          <span className="text-caption text-muted-foreground">{fmt(dict.detail.updatedAt, { date: format.dateTime(quote.regularMarketTime) })}</span>
        </div>
      </header>

      <section aria-label={dict.detail.indicators} className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex flex-col gap-1 p-4">
            <span className="text-overline uppercase tracking-widest text-muted-foreground">{stat.label}</span>
            <span className="font-mono text-body font-semibold tabular-nums">{stat.value}</span>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-4 space-y-0">
          <div className="flex flex-col gap-1.5">
            <CardTitle>{dict.detail.quote}</CardTitle>
            <CardDescription>
              {dict.detail.periodChange}: <span className={cn("font-mono", periodChange != null && (periodChange >= 0 ? "text-success" : "text-destructive"))}>{format.percent(periodChange)}</span>
              {closes.length > 0 && (
                <>
                  {" "}· {dict.detail.min} {format.currency(Math.min(...closes))} · {dict.detail.max} {format.currency(Math.max(...closes))}
                </>
              )}
            </CardDescription>
          </div>
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <RangeTabs ticker={ticker} active={range} available={allowed} dict={dict} />
            {allowed.length < Object.keys(ranges).length && (
              <span className="text-caption text-muted-foreground">{dict.detail.proRanges}</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {points.length > 1 ? (
            <>
              <PriceChart data={points} positive={(periodChange ?? 0) >= 0} />
              <div>
                <h3 className="mb-2 text-label font-medium text-muted-foreground">{dict.detail.tradedVolume}</h3>
                <VolumeChart data={points} />
              </div>
            </>
          ) : (
            <p className="py-16 text-center text-muted-foreground">{dict.detail.noHistory}</p>
          )}
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{dict.detail.history}</CardTitle>
            <CardDescription>{fmt(dict.detail.lastSessions, { n: Math.min(HISTORY_ROWS, history.length) })}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>{dict.detail.date}</TableHead>
                  <TableHead className="text-right">{dict.detail.open}</TableHead>
                  <TableHead className="text-right">{dict.detail.low}</TableHead>
                  <TableHead className="text-right">{dict.detail.high}</TableHead>
                  <TableHead className="text-right">{dict.detail.close}</TableHead>
                  <TableHead className="text-right">{dict.detail.volume}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history
                  .slice(-HISTORY_ROWS)
                  .reverse()
                  .map((point) => (
                    <TableRow key={point.date}>
                      <TableCell className="font-mono">{format.date(point.date)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{format.number(point.open)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{format.number(point.low)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{format.number(point.high)}</TableCell>
                      <TableCell className="text-right font-mono font-semibold tabular-nums">{format.number(point.close)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-muted-foreground">{format.compact(point.volume)}</TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function BackLink({ label }: { label: string }) {
  return (
    <Link href="/stocks" className="inline-flex w-fit items-center gap-1 text-body-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-(--size-icon-sm)" aria-hidden="true" />
      {label}
    </Link>
  );
}

/** Links estilizados como o TabsList do DS — o período fica na URL e a busca roda no servidor. */
function RangeTabs({ ticker, active, available, dict }: { ticker: string; active: Range; available: Range[]; dict: StocksDictionary }) {
  return (
    <nav aria-label={dict.detail.rangeLabel} className="inline-flex h-(--size-control-sm) items-center gap-1 rounded-md bg-muted p-1 text-muted-foreground">
      {available.map((range) => (
        <Link
          key={range}
          href={`/stocks/acao/${ticker}?range=${range}`}
          scroll={false}
          aria-current={range === active ? "page" : undefined}
          className={cn(
            "inline-flex items-center rounded-sm px-3 py-1 text-body-sm font-medium transition-colors duration-(--duration-fast) hover:text-foreground",
            range === active && "bg-background text-foreground shadow-xs",
          )}
        >
          {dict.detail.ranges[range]}
        </Link>
      ))}
    </nav>
  );
}

function QuoteUnavailable({ ticker, error, dict }: { ticker: string; error: unknown; dict: StocksDictionary }) {
  const missingToken = error instanceof BrapiError && error.code === "MISSING_TOKEN";

  return (
    <div className="flex flex-col gap-6">
      <BackLink label={dict.detail.back} />
      <Card className="mx-auto w-full max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-(--size-icon-md) text-warning" aria-hidden="true" />
            {missingToken ? fmt(dict.detail.needsToken, { ticker }) : dict.detail.unavailable}
          </CardTitle>
          <CardDescription>
            {missingToken ? fmt(dict.detail.needsTokenDescription, { tickers: FREE_TICKERS.join(", ") }) : dict.detail.tryAgain}
          </CardDescription>
        </CardHeader>
        {missingToken && (
          <CardContent className="flex flex-wrap gap-2">
            {FREE_TICKERS.map((free) => (
              <Link
                key={free}
                href={`/stocks/acao/${free}`}
                className="rounded-full border border-input px-3 py-1 font-mono text-caption text-muted-foreground hover:border-primary hover:text-primary"
              >
                {free}
              </Link>
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  );
}
