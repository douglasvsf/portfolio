import { cryptoMovers } from "./movers";

const coin = (symbol: string, change: number | null) => ({ symbol, price_change_percentage_24h: change });

it("5 maiores altas e 5 maiores quedas, em maiúsculas, ignorando moedas sem variação", () => {
  const coins = [coin("btc", 1), coin("eth", -2), coin("sol", 5), coin("xrp", null), coin("doge", -8), coin("ada", 3)];
  expect(cryptoMovers(coins, 2)).toEqual([
    { ticker: "SOL", change: 5 },
    { ticker: "ADA", change: 3 },
    { ticker: "ETH", change: -2 },
    { ticker: "DOGE", change: -8 },
  ]);
});

it("com poucas moedas, ninguém aparece duas vezes", () => {
  expect(cryptoMovers([coin("btc", 1), coin("eth", -1)])).toEqual([
    { ticker: "BTC", change: 1 },
    { ticker: "ETH", change: -1 },
  ]);
});
