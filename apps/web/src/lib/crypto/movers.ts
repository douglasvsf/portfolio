import type { Coin } from "./coingecko";

/** As 5 maiores altas e as 5 maiores quedas em 24h, no formato do gráfico de variação. */
export function cryptoMovers(coins: readonly Pick<Coin, "symbol" | "price_change_percentage_24h">[], count = 5) {
  const withChange = coins.filter((coin): coin is typeof coin & { price_change_percentage_24h: number } => coin.price_change_percentage_24h != null);
  const sorted = [...withChange].sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
  const gainers = sorted.slice(0, count);
  const losers = sorted.slice(-count).filter((coin) => !gainers.includes(coin));
  return [...gainers, ...losers].map((coin) => ({ ticker: coin.symbol.toUpperCase(), change: coin.price_change_percentage_24h }));
}
