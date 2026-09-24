import { getCryptoQuotes, getTopCoins, isCoingeckoConfigured } from "./coingecko";

jest.mock("server-only", () => ({}));

const originalFetch = global.fetch;
const originalKey = process.env.COINGECKO_API_KEY;

beforeEach(() => {
  process.env.COINGECKO_API_KEY = "CG-test";
});
afterEach(() => {
  global.fetch = originalFetch;
  process.env.COINGECKO_API_KEY = originalKey;
});

const coin = (id: string, symbol: string, price: number, extra: Record<string, unknown> = {}) => ({
  id, symbol, name: id, image: `https://coin-images.coingecko.com/${id}.png`, current_price: price, price_change_percentage_24h: 1.5, ...extra,
});

describe("CoinGecko", () => {
  it("sem chave não chama a API e devolve tudo em `missing`", async () => {
    delete process.env.COINGECKO_API_KEY;
    global.fetch = jest.fn();
    expect(isCoingeckoConfigured()).toBe(false);
    await expect(getCryptoQuotes(["BTC"])).resolves.toEqual({ quotes: {}, missing: ["BTC"] });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("uma chamada, em BRL, com a chave no header; símbolo repetido fica com a maior moeda", async () => {
    const fetchMock = jest.fn(async () =>
      new Response(JSON.stringify([coin("bitcoin", "btc", 438526), coin("ethereum", "eth", 23000), coin("bitcoin-clone", "btc", 1), { id: "quebrada" }])),
    );
    global.fetch = fetchMock as unknown as typeof fetch;
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});

    const { quotes, missing } = await getCryptoQuotes(["BTC", "ETH", "NAOEXISTE"]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit & { next?: unknown }];
    expect(new URL(url).searchParams.get("vs_currency")).toBe("brl");
    expect((init.headers as Record<string, string>)["x-cg-demo-api-key"]).toBe("CG-test");
    expect(init.next).toEqual({ revalidate: 600 });
    expect(quotes.BTC).toMatchObject({ price: 438526, change: 1.5, name: "bitcoin", assetClass: "crypto" });
    expect(quotes.ETH.price).toBe(23000);
    expect(missing).toEqual(["NAOEXISTE"]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining("1 item(s) descartado(s)"));
    warn.mockRestore();
  });

  it("lista completa para o Mercado: ranking, valor de mercado e volume; sem chave, null", async () => {
    global.fetch = jest.fn(async () => new Response(JSON.stringify([coin("bitcoin", "btc", 438526, { market_cap: 8.8e12, market_cap_rank: 1, total_volume: 1.9e11 })]))) as unknown as typeof fetch;
    await expect(getTopCoins()).resolves.toEqual([expect.objectContaining({ symbol: "btc", market_cap: 8.8e12, market_cap_rank: 1, total_volume: 1.9e11 })]);

    delete process.env.COINGECKO_API_KEY;
    await expect(getTopCoins()).resolves.toBeNull();
  });

  it("CoinGecko fora do ar ou respondendo lixo: preços viram `missing`, sem derrubar a carteira", async () => {
    const down = jest.fn(async () => new Response("erro", { status: 503 }));
    global.fetch = down as unknown as typeof fetch;
    await expect(getCryptoQuotes(["BTC"])).resolves.toEqual({ quotes: {}, missing: ["BTC"] });
    expect(down).toHaveBeenCalledTimes(3);

    global.fetch = jest.fn(async () => new Response("<html>")) as unknown as typeof fetch;
    await expect(getCryptoQuotes(["BTC"])).resolves.toEqual({ quotes: {}, missing: ["BTC"] });

    global.fetch = jest.fn(async () => new Response(JSON.stringify({ status: { error_code: 10002 } }))) as unknown as typeof fetch;
    jest.spyOn(console, "warn").mockImplementation(() => {});
    await expect(getCryptoQuotes(["BTC"])).resolves.toEqual({ quotes: {}, missing: ["BTC"] });
  });
});
