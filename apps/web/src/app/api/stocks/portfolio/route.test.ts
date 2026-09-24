import { NextRequest } from "next/server";
import { getCdiSince } from "@/lib/bcb/cdi";
import { getPortfolioQuotes } from "@/lib/stocks/portfolio-quotes";
import { BrapiError } from "@/lib/stocks/brapi";
import { GET } from "./route";

jest.mock("server-only", () => ({}));
jest.mock("../../../../lib/bcb/cdi", () => ({ getCdiSince: jest.fn() }));
jest.mock("../../../../lib/stocks/portfolio-quotes", () => ({ getPortfolioQuotes: jest.fn() }));

const quotes = jest.mocked(getPortfolioQuotes);
const cdi = jest.mocked(getCdiSince);
const call = (query: string) => GET(new NextRequest(`http://localhost/api/stocks/portfolio?${query}`));

describe("GET /api/stocks/portfolio", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    quotes.mockResolvedValue({ quotes: { PETR4: { price: 50, change: 1 } }, missing: [] });
    cdi.mockResolvedValue({ from: "2025-01-15", to: "2026-09-23", percent: 25, days: 400 });
  });

  it("devolve cotações e CDI, normalizando e deduplicando os tickers", async () => {
    const response = await call("tickers=petr4, PETR4 ,vale3&since=2025-01-15");
    expect(response.status).toBe(200);
    expect(quotes).toHaveBeenCalledWith(["PETR4", "VALE3"]);
    expect(cdi).toHaveBeenCalledWith("2025-01-15");
    expect(await response.json()).toMatchObject({ quotes: { PETR4: { price: 50 } }, cdi: { percent: 25 } });
    expect(response.headers.get("cache-control")).toContain("private");
  });

  it("sem `since`, não consulta o CDI", async () => {
    const response = await call("tickers=PETR4");
    expect(cdi).not.toHaveBeenCalled();
    expect((await response.json()).cdi).toBeNull();
  });

  it.each([["tickers="], ["tickers=DROP%20TABLE"], ["tickers=PETR4&since=2099-01-01"], ["since=2025-01-01"]])("consulta inválida (%s) → 400", async (query) => {
    expect((await call(query)).status).toBe(400);
  });

  it("brapi fora do ar → 502; rate limit → 429", async () => {
    quotes.mockRejectedValueOnce(new BrapiError("x", "UNAVAILABLE", 503));
    expect((await call("tickers=PETR4")).status).toBe(502);
    quotes.mockRejectedValueOnce(new BrapiError("x", "RATE_LIMITED", 429));
    expect((await call("tickers=PETR4")).status).toBe(429);
  });
});
