import type { erp } from "@portfolio/shared";
import { formatMonth, money, parseMoneyToCents, parseQuantity, quantity, timeLeft } from "./format";
import { decodeSession, encodeSession, type ErpSession } from "./session";

jest.mock("server-only", () => ({}));

const cookieStore = new Map<string, string>();
const cookieCalls = { set: jest.fn(), delete: jest.fn() };
jest.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (cookieStore.has(name) ? { value: cookieStore.get(name) } : undefined),
    set: (...args: unknown[]) => cookieCalls.set(...args),
    delete: (...args: unknown[]) => cookieCalls.delete(...args),
  }),
  headers: async () => new Headers({ "x-forwarded-for": "200.1.2.3, 10.0.0.1" }),
}));

const future = new Date(Date.now() + 3_600_000).toISOString();
const session: ErpSession = { kind: "demo", token: "jwt", role: "seller", workspace: { id: "a".repeat(24), name: "Mercado Godzilla #TEST" }, expiresAt: future };

describe("formatação do ERP", () => {
  it("dinheiro em centavos ↔ texto", () => {
    expect(money(123456)).toBe("R$ 1.234,56".replace(" ", " "));
    expect(parseMoneyToCents("12,90")).toBe(1290);
    expect(parseMoneyToCents("R$ 1.234,56")).toBe(123456);
    expect(parseMoneyToCents("12.9")).toBe(1290);
    expect(parseMoneyToCents("abc")).toBeNaN();
  });

  it("quantidades com vírgula e unidade", () => {
    expect(parseQuantity("1,25")).toBe(1.25);
    expect(parseQuantity(" 3 ")).toBe(3);
    expect(parseQuantity("")).toBeNaN();
    expect(quantity(17.5, "kg")).toBe("17,5 kg");
    expect(quantity(3, "l")).toBe("3 L");
  });

  it("mês curto e tempo restante da demo", () => {
    expect(formatMonth("2026-04")).toMatch(/abr/);
    const now = Date.parse("2026-09-28T12:00:00Z");
    expect(timeLeft("2026-09-29T11:00:00Z", now)).toBe("23 h");
    expect(timeLeft("2026-09-28T12:40:00Z", now)).toBe("40 min");
    expect(timeLeft("2026-09-28T11:00:00Z", now)).toBe("0 min");
  });
});

describe("sessão (cookie)", () => {
  it("codifica e decodifica; rejeita lixo, papel inválido e sessão vencida", () => {
    expect(decodeSession(encodeSession(session))).toEqual(session);
    expect(decodeSession(undefined)).toBeNull();
    expect(decodeSession("nao-e-base64-json")).toBeNull();
    expect(decodeSession(encodeSession({ ...session, role: "root" as erp.Role }))).toBeNull();
    expect(decodeSession(encodeSession({ ...session, expiresAt: new Date(Date.now() - 1000).toISOString() }))).toBeNull();
  });

  it("grava httpOnly, só em /erp e com o prazo da demo", async () => {
    const { saveSession, clearSession } = await import("./session");
    await saveSession({ token: "jwt", role: "admin", workspace: session.workspace, expiresAt: future });
    const [name, , options] = cookieCalls.set.mock.calls[0] as [string, string, Record<string, unknown>];
    expect(name).toBe("erp_session");
    expect(options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/erp" });
    expect(options.maxAge).toBeGreaterThan(3500);
    await clearSession();
    expect(cookieCalls.delete).toHaveBeenCalledWith({ name: "erp_session", path: "/erp" });
  });
});

describe("cliente da API (BFF)", () => {
  const originalFetch = global.fetch;
  beforeEach(() => {
    process.env.ERP_API_URL = "https://api.exemplo.dev";
    process.env.ERP_BFF_KEY = "chave-bff";
    cookieStore.set("erp_session", encodeSession(session));
  });
  afterEach(() => {
    global.fetch = originalFetch;
    cookieStore.clear();
  });

  it("envia token, chave do BFF e IP real do visitante; monta a query", async () => {
    const fetchMock = jest.fn(async () => new Response(JSON.stringify({ items: [] })));
    global.fetch = fetchMock as unknown as typeof fetch;
    const { erpRequest } = await import("./client");

    await erpRequest("/erp/products", { query: { page: 2, search: "arroz", category: undefined } });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(url.toString()).toBe("https://api.exemplo.dev/erp/products?page=2&search=arroz");
    expect(init.headers).toMatchObject({ authorization: "Bearer jwt", "x-bff-key": "chave-bff", "x-client-ip": "200.1.2.3" });
  });

  it("erro da API vira ErpApiError com o código estável", async () => {
    global.fetch = jest.fn(
      async () => new Response(JSON.stringify({ error: "insufficient_stock", message: "Estoque insuficiente", details: [{ name: "Arroz" }] }), { status: 409 }),
    ) as unknown as typeof fetch;
    const { erpRequest, isApiError } = await import("./client");
    const error = await erpRequest("/erp/orders/x/confirm", { method: "POST" }).catch((caught: unknown) => caught);
    expect(isApiError(error, "insufficient_stock")).toBe(true);
    expect(error).toMatchObject({ status: 409, message: "Estoque insuficiente", details: [{ name: "Arroz" }] });
  });

  it("sem sessão, rede fora do ar e 204", async () => {
    const { erpRequest } = await import("./client");
    cookieStore.clear();
    await expect(erpRequest("/erp/products")).rejects.toMatchObject({ code: "unauthorized" });

    cookieStore.set("erp_session", encodeSession(session));
    global.fetch = jest.fn().mockRejectedValue(new TypeError("fetch failed"));
    await expect(erpRequest("/erp/products")).rejects.toMatchObject({ status: 503 });

    global.fetch = jest.fn(async () => new Response(null, { status: 204 })) as unknown as typeof fetch;
    await expect(erpRequest("/erp/products/x", { method: "DELETE" })).resolves.toBeUndefined();
  });

  it("criar a demo não precisa de sessão", async () => {
    cookieStore.clear();
    const fetchMock = jest.fn(async () => new Response(JSON.stringify({ token: "novo" }), { status: 201 }));
    global.fetch = fetchMock as unknown as typeof fetch;
    const { erpRequest } = await import("./client");
    await expect(erpRequest("/erp/sessions/demo", { method: "POST", anonymous: true })).resolves.toEqual({ token: "novo" });
    expect((fetchMock.mock.calls[0] as unknown as [URL, RequestInit])[1].headers).not.toHaveProperty("authorization");
  });
});
