import Link from "next/link";
import { ArrowRight } from "@godzilla/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@godzilla/ui";
import type { StocksDictionary } from "@/content/stocks";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/message";
import { getTopCoins } from "@/lib/crypto/coingecko";
import { cryptoMovers } from "@/lib/crypto/movers";
import { createFormatters } from "@/lib/stocks/format";
import { ChangeBadge } from "./change-badge";
import { MoversChart } from "./movers-chart";
import { StockLogo } from "./stock-logo";

/** Universo das altas/quedas: as maiores por valor de mercado (evita moedas sem liquidez). */
const MOVERS_UNIVERSE = 50;
const TOP_TABLE = 10;

/**
 * Seção de cripto do Mercado. Usa a mesma lista em cache da carteira — não
 * gasta cota a mais da CoinGecko. Sem chave ou com a API fora do ar, a seção
 * simplesmente não aparece.
 */
export async function CryptoSection({ dict, locale }: { dict: StocksDictionary; locale: Locale }) {
  const coins = await getTopCoins();
  if (!coins?.length) return null;

  const { crypto } = dict;
  const format = createFormatters(locale);
  const movers = cryptoMovers(coins.slice(0, MOVERS_UNIVERSE));

  return (
    <section aria-labelledby="crypto-title" className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 id="crypto-title" className="text-h3 font-semibold">
          {crypto.title}
        </h2>
        <p className="text-body-sm text-muted-foreground">{crypto.description}</p>
      </div>

      {/* A tabela precisa de mais largura que o gráfico: 2/5 × 3/5. */}
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle as="h3">{crypto.moversTitle}</CardTitle>
            <CardDescription>{fmt(crypto.moversDescription, { n: MOVERS_UNIVERSE })}</CardDescription>
          </CardHeader>
          <CardContent>
            <MoversChart data={movers} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle as="h3">{crypto.topTitle}</CardTitle>
            <CardDescription>{crypto.topDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">{crypto.rank}</TableHead>
                  <TableHead>{crypto.asset}</TableHead>
                  <TableHead className="text-right">{crypto.price}</TableHead>
                  <TableHead className="text-right">{crypto.change}</TableHead>
                  <TableHead className="hidden text-right sm:table-cell lg:hidden xl:table-cell">{crypto.marketCap}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {coins.slice(0, TOP_TABLE).map((coin, index) => (
                  <TableRow key={coin.id}>
                    <TableCell className="font-mono text-muted-foreground">{coin.market_cap_rank ?? index + 1}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-3">
                        <StockLogo src={coin.image} ticker={coin.symbol.toUpperCase()} size={24} />
                        <span className="flex flex-col">
                          <span className="font-mono font-semibold">{coin.symbol.toUpperCase()}</span>
                          <span className="max-w-32 truncate text-caption text-muted-foreground">{coin.name}</span>
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{format.price(coin.current_price)}</TableCell>
                    <TableCell className="text-right">
                      <ChangeBadge value={coin.price_change_percentage_24h} locale={locale} />
                    </TableCell>
                    <TableCell className="hidden text-right font-mono tabular-nums sm:table-cell lg:hidden xl:table-cell">{format.currencyCompact(coin.market_cap)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-body-sm">
        <Link href="/stocks/carteira" className="inline-flex items-center gap-1 font-mono text-primary underline-offset-4 hover:underline">
          {crypto.track}
          <ArrowRight className="size-(--size-icon-sm)" aria-hidden="true" />
        </Link>
        {/* Atribuição exigida pelo plano gratuito da CoinGecko. */}
        <a href="https://www.coingecko.com/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground underline-offset-4 hover:text-primary hover:underline">
          {crypto.source}
        </a>
      </div>
    </section>
  );
}

export function CryptoSectionSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-5" aria-hidden="true">
      <Skeleton className="h-96 rounded-lg lg:col-span-2" />
      <Skeleton className="h-96 rounded-lg lg:col-span-3" />
    </div>
  );
}
