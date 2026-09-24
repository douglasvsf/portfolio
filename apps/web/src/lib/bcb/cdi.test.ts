import { accumulate, getCdiSince } from "./cdi";

jest.mock("server-only", () => ({}));

const originalFetch = global.fetch;
afterEach(() => {
  global.fetch = originalFetch;
});

const TODAY = new Date("2026-09-24T12:00:00Z");

describe("CDI do Banco Central", () => {
  it("compõe as taxas diárias", () => {
    expect(accumulate([1, 1])).toBeCloseTo(2.01);
    expect(accumulate([])).toBe(0);
  });

  it("consulta o período em dd/mm/aaaa e devolve o acumulado", async () => {
    const fetchMock = jest.fn(async () =>
      new Response(JSON.stringify([{ data: "15/01/2025", valor: "0.05" }, { data: "16/01/2025", valor: "0.05" }])),
    );
    global.fetch = fetchMock as unknown as typeof fetch;

    const cdi = await getCdiSince("2025-01-15", TODAY);
    expect(cdi).toMatchObject({ from: "2025-01-15", to: "2025-01-16", days: 2 });
    expect(cdi?.percent).toBeCloseTo(0.100025);
    const url = new URL(String((fetchMock.mock.calls[0] as unknown[])[0]));
    expect(url.searchParams.get("dataInicial")).toBe("15/01/2025");
    expect(url.searchParams.get("dataFinal")).toBe("24/09/2026");
  });

  it("limita a consulta a 10 anos (regra do SGS)", async () => {
    const fetchMock = jest.fn(async () => new Response(JSON.stringify([{ data: "24/09/2016", valor: "0.05" }])));
    global.fetch = fetchMock as unknown as typeof fetch;
    await getCdiSince("2005-01-01", TODAY);
    expect(new URL(String((fetchMock.mock.calls[0] as unknown[])[0])).searchParams.get("dataInicial")).toBe("24/09/2016");
  });

  it("falha do BCB vira null (a tela só esconde a comparação), com retry em 5xx", async () => {
    const fetchMock = jest.fn(async () => new Response("erro", { status: 503 }));
    global.fetch = fetchMock as unknown as typeof fetch;
    await expect(getCdiSince("2025-01-15", TODAY)).resolves.toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(3);

    global.fetch = jest.fn(async () => new Response("<html>")) as unknown as typeof fetch;
    await expect(getCdiSince("2025-01-15", TODAY)).resolves.toBeNull();

    global.fetch = jest.fn().mockRejectedValue(new TypeError("fetch failed"));
    await expect(getCdiSince("2025-01-15", TODAY)).resolves.toBeNull();
  });

  it("período vazio ou no futuro não consulta", async () => {
    global.fetch = jest.fn();
    await expect(getCdiSince("2026-09-24", TODAY)).resolves.toBeNull();
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
