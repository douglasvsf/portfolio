import { enUS } from "@/content/stocks/en-US";
import { esES } from "@/content/stocks/es-ES";
import { ptBR } from "@/content/stocks/pt-BR";
import brapiQuote from "@/lib/__fixtures__/brapi-quote-petr4.json";
import { contractReporter } from "@/lib/http/contract";
import { BrapiError, availableRanges, getQuote, isFreeTicker, isRange, listStocks } from "./brapi";
import { createFormatters } from "./format";
import { sectorLabel } from "./sectors";

const originalFetch = global.fetch;
const originalToken = process.env.BRAPI_TOKEN;

afterEach(() => {
  global.fetch = originalFetch;
  process.env.BRAPI_TOKEN = originalToken;
  jest.restoreAllMocks();
});

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });

describe("brapi — períodos por plano", () => {
  it("tickers de teste liberam todos os períodos; os demais só até 3 meses", () => {
    expect(isFreeTicker("PETR4")).toBe(true);
    expect(availableRanges("PETR4")).toEqual(["5d", "1mo", "3mo", "1y", "5y"]);
    expect(availableRanges("BBAS3")).toEqual(["5d", "1mo", "3mo"]);
  });

  it("valida o período vindo da URL", () => {
    expect(isRange("1y")).toBe(true);
    expect(isRange("10y")).toBe(false);
    expect(isRange(undefined)).toBe(false);
  });
});

describe("brapi — requisições", () => {
  it("lista ações com os filtros, ignorando os vazios, e envia o token quando existe", async () => {
    process.env.BRAPI_TOKEN = "tok";
    const fetchMock = jest.fn().mockResolvedValue(json({ stocks: [], availableSectors: [], currentPage: 1, totalPages: 0, totalCount: 0, hasNextPage: false }));
    global.fetch = fetchMock;

    await listStocks({ search: "", sector: "Finance", sortBy: "volume", sortOrder: "desc" });

    const [url, init] = fetchMock.mock.calls[0];
    expect(Object.fromEntries(new URL(url).searchParams)).toEqual({
      type: "stock",
      limit: "20",
      page: "1",
      sector: "Finance",
      sortBy: "volume",
      sortOrder: "desc",
    });
    expect(init.headers).toEqual({ Authorization: "Bearer tok" });
    expect(init.next).toEqual({ revalidate: 300 });
  });

  it("pede o intervalo de vela certo para o período", async () => {
    const fetchMock = jest.fn().mockResolvedValue(json(brapiQuote));
    global.fetch = fetchMock;

    await getQuote("PETR4", "5y");
    expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get("interval")).toBe("1mo");
  });

  it("converte erros da brapi (inclusive com HTTP 200) em BrapiError", async () => {
    global.fetch = jest.fn().mockResolvedValue(json({ error: true, message: "Token de autenticação não fornecido", code: "MISSING_TOKEN" }, 401));
    await expect(getQuote("BBAS3", "3mo")).rejects.toMatchObject({ name: "BrapiError", code: "MISSING_TOKEN", status: 401 });

    // Um Response novo por chamada: o corpo só pode ser lido uma vez.
    global.fetch = jest.fn(async () => json({ results: [] })) as unknown as typeof fetch;
    await expect(getQuote("XXXX9", "3mo")).rejects.toBeInstanceOf(BrapiError);
    await expect(getQuote("XXXX9", "3mo")).rejects.toMatchObject({ code: "NOT_FOUND", status: 404 });
  });

  it("5xx sem JSON é repetido e, se persistir, vira UNAVAILABLE", async () => {
    const fetchMock = jest.fn(async () => new Response("<html>502</html>", { status: 502 }));
    global.fetch = fetchMock as unknown as typeof fetch;
    await expect(listStocks()).rejects.toMatchObject({ code: "UNAVAILABLE", status: 502 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it("falha de rede passageira se recupera no retry", async () => {
    const fetchMock = jest.fn().mockRejectedValueOnce(new TypeError("fetch failed")).mockResolvedValue(json(brapiQuote));
    global.fetch = fetchMock;
    await expect(getQuote("PETR4", "5d")).resolves.toMatchObject({ symbol: "PETR4" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("erro de negócio (4xx) não é repetido", async () => {
    const fetchMock = jest.fn(async () => json({ error: true, message: "x", code: "MISSING_TOKEN" }, 401));
    global.fetch = fetchMock as unknown as typeof fetch;
    await expect(getQuote("BBAS3", "3mo")).rejects.toMatchObject({ code: "MISSING_TOKEN" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("resposta fora do contrato vira INVALID_RESPONSE", async () => {
    jest.spyOn(contractReporter, "report").mockImplementation(() => {});
    global.fetch = jest.fn().mockResolvedValue(json({ results: [{ symbol: "PETR4" }] }));
    await expect(getQuote("PETR4", "5d")).rejects.toMatchObject({ name: "BrapiError", code: "INVALID_RESPONSE" });
  });
});

describe("formatação por idioma (moeda sempre BRL)", () => {
  it("formata moeda, número compacto e percentual", () => {
    const pt = createFormatters("pt-BR");
    const en = createFormatters("en-US");
    expect(pt.currency(49.6)).toMatch(/R\$\s?49,60/);
    expect(en.currency(49.6)).toBe("R$49.60");
    expect(pt.compact(1_100_000_000)).toMatch(/1,1\s?bi/);
    expect(en.compact(1_100_000_000)).toBe("1.1B");
    expect(pt.percent(2.5)).toBe("+2,5%");
    expect(en.percent(-1.22)).toBe("-1.22%");
    expect(pt.currency(null)).toBe("—");
  });

  it("datas no fuso de São Paulo", () => {
    // 2026-09-24T02:00Z ainda é dia 23 em São Paulo (UTC-3).
    expect(createFormatters("pt-BR").date(Date.parse("2026-09-24T02:00:00Z") / 1000)).toBe("23/09/2026");
  });
});

describe("setores", () => {
  it("traduz pelo dicionário e mantém o original quando não há tradução", () => {
    expect(sectorLabel("Finance", ptBR)).toBe("Financeiro");
    expect(sectorLabel("Finance", esES)).toBe("Finanzas");
    expect(sectorLabel("Finance", enUS)).toBe("Finance");
    expect(sectorLabel("Setor Novo", ptBR)).toBe("Setor Novo");
    expect(sectorLabel(null, ptBR)).toBe("Sem setor");
  });

  it("os três idiomas traduzem os mesmos setores", () => {
    expect(Object.keys(esES.sectors).sort()).toEqual(Object.keys(ptBR.sectors).sort());
  });
});
