import { getCryptoQuotes } from "../crypto/coingecko";
import type { MarketQuote } from "../portfolio/positions";
import { listStocks, type ListedStock } from "./brapi";
import { getPortfolioQuotes } from "./portfolio-quotes";

jest.mock("server-only", () => ({}));
jest.mock("./brapi", () => ({ listStocks: jest.fn() }));
jest.mock("../crypto/coingecko", () => ({ getCryptoQuotes: jest.fn() }));

const crypto = jest.mocked(getCryptoQuotes);

const list = jest.mocked(listStocks);
const stock = (ticker: string, type: string, subType: string | null, close = 10): ListedStock => ({
  stock: ticker, name: ticker, close, change: 1, volume: 1, market_cap: null, logo: null, sector: null, type, subType,
});
const universes: Record<string, ListedStock[]> = {
  stock: [stock("PETR4", "stock", "stock", 50)],
  fund: [stock("MXRF11", "fund", "fii", 9), stock("BOVA11", "fund", "etf", 180)],
  bdr: [stock("AAPL34", "bdr", "bdr", 87)],
};

beforeEach(() => {
  list.mockReset();
  crypto.mockReset();
  crypto.mockImplementation(async (symbols) => ({
    quotes: (symbols.includes("BTC") ? { BTC: { price: 438526, change: 0.6, assetClass: "crypto" } } : {}) as Record<string, MarketQuote>,
    missing: symbols.filter((symbol) => symbol !== "BTC"),
  }));
  list.mockImplementation(async ({ type = "stock" } = {}) => ({ stocks: universes[type], availableSectors: [], currentPage: 1, totalPages: 1, totalCount: 1, hasNextPage: false }));
});

it("busca ações e fundos em 2 chamadas e classifica cada ativo", async () => {
  const { quotes, missing } = await getPortfolioQuotes(["PETR4", "MXRF11", "BOVA11"]);
  expect(list).toHaveBeenCalledTimes(2);
  expect(quotes.PETR4).toMatchObject({ price: 50, assetClass: "stock" });
  expect(quotes.MXRF11).toMatchObject({ price: 9, assetClass: "fii" });
  expect(quotes.BOVA11).toMatchObject({ price: 180, assetClass: "etf" });
  expect(missing).toEqual([]);
});

it("só busca BDRs quando falta algum ticker; o que não existir volta em `missing`", async () => {
  const { quotes, missing } = await getPortfolioQuotes(["PETR4", "AAPL34", "XXXX3"]);
  expect(list).toHaveBeenCalledTimes(3);
  expect(list).toHaveBeenLastCalledWith(expect.objectContaining({ type: "bdr" }));
  expect(quotes.AAPL34).toMatchObject({ assetClass: "bdr" });
  expect(missing).toEqual(["XXXX3"]);
});

it("separa B3 e cripto: carteira só de cripto nem consulta a brapi", async () => {
  const { quotes, missing } = await getPortfolioQuotes(["BTC", "DOGEX"]);
  expect(list).not.toHaveBeenCalled();
  expect(crypto).toHaveBeenCalledWith(["BTC", "DOGEX"]);
  expect(quotes.BTC).toMatchObject({ assetClass: "crypto" });
  expect(missing).toEqual(["DOGEX"]);
});

it("carteira mista junta as duas fontes", async () => {
  const { quotes } = await getPortfolioQuotes(["PETR4", "BTC"]);
  expect(crypto).toHaveBeenCalledWith(["BTC"]);
  expect(Object.keys(quotes).sort()).toEqual(["BTC", "PETR4"]);
});
