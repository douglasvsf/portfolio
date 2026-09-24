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
import { BrapiError, FREE_TICKERS, getQuote, isRange, ranges, type HistoricalPrice, type Range } from "@/lib/brapi";
import { formatCompact, formatCurrency, formatDate, formatDateTime, formatNumber, formatPercent } from "@/lib/format";
import { ChangeBadge } from "@/components/change-badge";
import { StockLogo } from "@/components/stock-logo";
import { PriceChart, VolumeChart, type PricePoint } from "@/components/price-chart";

const HISTORY_ROWS = 15;
const TICKER_PATTERN = /^[A-Z0-9]{4,8}$/;

export async function generateMetadata({ params }: PageProps<"/acao/[ticker]">): Promise<Metadata> {
  const { ticker } = await params;
  return { title: ticker.toUpperCase() };
}

export default async function StockPage({ params, searchParams }: PageProps<"/acao/[ticker]">) {
  const ticker = (await params).ticker.toUpperCase();
  if (!TICKER_PATTERN.test(ticker)) notFound();

  const rangeParam = (await searchParams).range;
  const range: Range = isRange(rangeParam) ? rangeParam : "3mo";

  let quote;
  try {
    quote = await getQuote(ticker, range);
  } catch (error) {
    if (error instanceof BrapiError && error.status === 404) notFound();
    return <QuoteUnavailable ticker={ticker} error={error} />;
  }

  const history = (quote.historicalDataPrice ?? []).filter(
    (point): point is HistoricalPrice & { close: number } => point.close != null,
  );
  const monthly = ranges[range].interval === "1mo";
  const points: PricePoint[] = history.map((point) => ({
    label: formatDate(point.date, monthly ? { month: "2-digit", year: "2-digit" } : { day: "2-digit", month: "2-digit" }),
    date: formatDate(point.date, monthly ? { month: "long", year: "numeric" } : { dateStyle: "medium" }),
    close: point.close,
    volume: point.volume ?? 0,
  }));

  const first = history[0]?.close;
  const periodChange = first ? ((quote.regularMarketPrice - first) / first) * 100 : null;
  const closes = history.map((point) => point.close);

  const stats = [
    { label: "Abertura", value: formatCurrency(quote.regularMarketOpen) },
    { label: "Fech. anterior", value: formatCurrency(quote.regularMarketPreviousClose) },
    { label: "Mín. / Máx. dia", value: `${formatNumber(quote.regularMarketDayLow)} – ${formatNumber(quote.regularMarketDayHigh)}` },
    { label: "Mín. / Máx. 52 sem.", value: `${formatNumber(quote.fiftyTwoWeekLow)} – ${formatNumber(quote.fiftyTwoWeekHigh)}` },
    { label: "Volume", value: formatCompact(quote.regularMarketVolume) },
    { label: "Valor de mercado", value: formatCompact(quote.marketCap) },
    { label: "P/L", value: formatNumber(quote.priceEarnings) },
    { label: "LPA", value: formatCurrency(quote.earningsPerShare) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <BackLink />

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
            <span className="font-mono text-h2 font-bold tabular-nums">{formatCurrency(quote.regularMarketPrice)}</span>
            <ChangeBadge value={quote.regularMarketChangePercent} className="text-body-sm" />
          </div>
          <span className="text-caption text-muted-foreground">Atualizado em {formatDateTime(quote.regularMarketTime)}</span>
        </div>
      </header>

      <section aria-label="Indicadores" className="grid grid-cols-2 gap-3 md:grid-cols-4">
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
            <CardTitle>Cotação</CardTitle>
            <CardDescription>
              No período: <span className={cn("font-mono", periodChange != null && (periodChange >= 0 ? "text-success" : "text-destructive"))}>{formatPercent(periodChange)}</span>
              {closes.length > 0 && (
                <>
                  {" "}· mín. {formatCurrency(Math.min(...closes))} · máx. {formatCurrency(Math.max(...closes))}
                </>
              )}
            </CardDescription>
          </div>
          <RangeTabs ticker={ticker} active={range} />
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {points.length > 1 ? (
            <>
              <PriceChart data={points} positive={(periodChange ?? 0) >= 0} />
              <div>
                <h3 className="mb-2 text-label font-medium text-muted-foreground">Volume negociado</h3>
                <VolumeChart data={points} />
              </div>
            </>
          ) : (
            <p className="py-16 text-center text-muted-foreground">Sem histórico para esse período.</p>
          )}
        </CardContent>
      </Card>

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico</CardTitle>
            <CardDescription>Últimos {Math.min(HISTORY_ROWS, history.length)} pregões do período</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Abertura</TableHead>
                  <TableHead className="text-right">Mínima</TableHead>
                  <TableHead className="text-right">Máxima</TableHead>
                  <TableHead className="text-right">Fechamento</TableHead>
                  <TableHead className="text-right">Volume</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history
                  .slice(-HISTORY_ROWS)
                  .reverse()
                  .map((point) => (
                    <TableRow key={point.date}>
                      <TableCell className="font-mono">{formatDate(point.date)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{formatNumber(point.open)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{formatNumber(point.low)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{formatNumber(point.high)}</TableCell>
                      <TableCell className="text-right font-mono font-semibold tabular-nums">{formatNumber(point.close)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-muted-foreground">{formatCompact(point.volume)}</TableCell>
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

function BackLink() {
  return (
    <Link href="/" className="inline-flex w-fit items-center gap-1 text-body-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-(--size-icon-sm)" aria-hidden="true" />
      Voltar ao mercado
    </Link>
  );
}

/** Links estilizados como o TabsList do DS — o período fica na URL e a busca roda no servidor. */
function RangeTabs({ ticker, active }: { ticker: string; active: Range }) {
  return (
    <nav aria-label="Período" className="inline-flex h-(--size-control-sm) items-center gap-1 rounded-md bg-muted p-1 text-muted-foreground">
      {(Object.keys(ranges) as Range[]).map((range) => (
        <Link
          key={range}
          href={`/acao/${ticker}?range=${range}`}
          scroll={false}
          aria-current={range === active ? "page" : undefined}
          className={cn(
            "inline-flex items-center rounded-sm px-3 py-1 text-body-sm font-medium transition-colors duration-(--duration-fast) hover:text-foreground",
            range === active && "bg-background text-foreground shadow-xs",
          )}
        >
          {ranges[range].label}
        </Link>
      ))}
    </nav>
  );
}

function QuoteUnavailable({ ticker, error }: { ticker: string; error: unknown }) {
  const missingToken = error instanceof BrapiError && error.code === "MISSING_TOKEN";

  return (
    <div className="flex flex-col gap-6">
      <BackLink />
      <Card className="mx-auto w-full max-w-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="size-(--size-icon-md) text-warning" aria-hidden="true" />
            {missingToken ? `Histórico de ${ticker} precisa de token` : "Não foi possível carregar a cotação"}
          </CardTitle>
          <CardDescription>
            {missingToken ? (
              <>
                Sem token, a brapi só libera o detalhe de {FREE_TICKERS.join(", ")}. Crie um token gratuito em{" "}
                <a href="https://brapi.dev/dashboard" className="text-primary underline-offset-4 hover:underline">
                  brapi.dev
                </a>{" "}
                e defina <code className="font-mono text-foreground">BRAPI_TOKEN</code> no ambiente.
              </>
            ) : (
              error instanceof Error ? error.message : "Tente novamente em instantes."
            )}
          </CardDescription>
        </CardHeader>
        {missingToken && (
          <CardContent className="flex flex-wrap gap-2">
            {FREE_TICKERS.map((free) => (
              <Link
                key={free}
                href={`/acao/${free}`}
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
