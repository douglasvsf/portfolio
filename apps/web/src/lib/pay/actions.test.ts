jest.mock("server-only", () => ({}));

const redirect = jest.fn((url: string) => {
  throw Object.assign(new Error("NEXT_REDIRECT"), { url });
});
jest.mock("next/navigation", () => ({ redirect: (url: string) => redirect(url) }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

const cookieJar = { set: jest.fn(), delete: jest.fn(), get: jest.fn() };
jest.mock("next/headers", () => ({ cookies: async () => cookieJar, headers: async () => new Headers() }));

const erpRequest = jest.fn();
jest.mock("../erp/client", () => {
  const actual = jest.requireActual("../erp/client");
  return { ...actual, erpRequest: (...args: unknown[]) => erpRequest(...args) };
});

import { IDLE } from "../erp/action-state";
import { ErpApiError } from "../erp/client";
import * as pay from "./actions";
import { decodePaySession } from "./session";

const API_KEY = `gz_test_${"a".repeat(32)}`;
const EXPIRES = "2099-01-01T00:00:00.000Z";
const SANDBOX = { id: "m1", name: "Loja Kaiju 1234", apiKey: API_KEY, webhookSecret: "whsec_x", pixKey: "k", expiresAt: EXPIRES };
const stored = Buffer.from(JSON.stringify({ apiKey: API_KEY, merchantId: "m1", name: "Loja Kaiju 1234", expiresAt: EXPIRES })).toString("base64url");
const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};
const redirectedTo = (promise: Promise<unknown>) => promise.then(() => undefined, (error: { url?: string }) => error.url);

beforeEach(() => {
  jest.clearAllMocks();
  cookieJar.get.mockReturnValue({ value: stored });
});

describe("loja de teste", () => {
  it("cria a loja e guarda a chave num cookie httpOnly restrito a /pay", async () => {
    erpRequest.mockResolvedValueOnce(SANDBOX);
    expect(await redirectedTo(pay.createSandbox())).toBe("/pay/cobrancas");
    expect(erpRequest).toHaveBeenCalledWith("/pay/sandboxes", { method: "POST", anonymous: true });
    const [name, value, options] = cookieJar.set.mock.calls[0];
    expect(name).toBe("pay_session");
    expect(options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/pay" });
    expect(decodePaySession(value)).toMatchObject({ apiKey: API_KEY, name: "Loja Kaiju 1234" });
  });

  it("limite, lotação e API fora do ar viram mensagem, sem detalhe interno", async () => {
    erpRequest.mockRejectedValueOnce(new ErpApiError(429, "rate_limited", "x"));
    await expect(pay.createSandbox()).resolves.toMatchObject({ message: expect.stringContaining("várias lojas") });
    erpRequest.mockRejectedValueOnce(new ErpApiError(503, "demo_full", "x"));
    await expect(pay.createSandbox()).resolves.toMatchObject({ message: expect.stringContaining("Muitas lojas") });
    erpRequest.mockRejectedValueOnce(new ErpApiError(503, "internal_error", "ERP_API_URL não configurada"));
    const down = await pay.createSandbox();
    expect(JSON.stringify(down)).not.toContain("ERP_API_URL");
    expect(cookieJar.set).not.toHaveBeenCalled();
  });

  it("cookie adulterado, sem chave válida ou vencido não vale como sessão", () => {
    const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
    expect(decodePaySession("lixo")).toBeNull();
    expect(decodePaySession(encode({ apiKey: "outra-coisa", name: "x", expiresAt: EXPIRES }))).toBeNull();
    expect(decodePaySession(encode({ apiKey: API_KEY, name: "x", expiresAt: "2020-01-01T00:00:00Z" }))).toBeNull();
  });

  it("sair apaga o cookie", async () => {
    expect(await redirectedTo(pay.leaveSandbox())).toBe("/pay");
    expect(cookieJar.delete).toHaveBeenCalledWith({ name: "pay_session", path: "/pay" });
  });
});

describe("cobrança", () => {
  it("converte o valor digitado em centavos e manda a Idempotency-Key da tela com a chave da loja", async () => {
    erpRequest.mockResolvedValueOnce({ id: "c1" });
    const target = await redirectedTo(
      pay.createCharge(IDLE, form({ amount: "1.234,56", description: " Pedido 42 ", expiresIn: "900", customerName: "Ana Souza", customerDocument: "390.533.447-05", idempotencyKey: "chave-da-tela-123" })),
    );
    expect(target).toBe("/pay/cobrancas/c1");
    expect(erpRequest).toHaveBeenCalledWith("/pay/charges", {
      method: "POST",
      body: { amountCents: 123_456, description: "Pedido 42", expiresIn: 900, customer: { name: "Ana Souza", document: "39053344705" } },
      token: API_KEY,
      headers: { "Idempotency-Key": "chave-da-tela-123" },
    });
  });

  it("valor vazio, zero ou acima do limite e documento inválido não chegam à API", async () => {
    const cases: Record<string, string>[] = [{ amount: "" }, { amount: "0,00" }, { amount: "100.000,01" }, { amount: "10,00", customerName: "Ana", customerDocument: "123" }];
    for (const fields of cases) {
      const state = await pay.createCharge(IDLE, form({ expiresIn: "3600", idempotencyKey: "k-12345678", ...fields }));
      expect(state.status).toBe("error");
    }
    const amount = await pay.createCharge(IDLE, form({ amount: "", expiresIn: "3600" }));
    expect(amount).toMatchObject({ fieldErrors: { amount: expect.stringContaining("R$ 0,01") } });
    expect(erpRequest).not.toHaveBeenCalled();
  });

  it("erro de negócio da API vira a mensagem dela; loja vencida volta para a entrada", async () => {
    erpRequest.mockRejectedValueOnce(new ErpApiError(409, "invalid_state", "Esta cobrança já foi paga."));
    await expect(pay.simulatePayment("c1")).resolves.toEqual({ status: "error", message: "Esta cobrança já foi paga." });

    erpRequest.mockRejectedValueOnce(new ErpApiError(401, "unauthorized", "x"));
    expect(await redirectedTo(pay.simulatePayment("c1"))).toBe("/pay?expirou=1");
    expect(cookieJar.delete).toHaveBeenCalled();

    cookieJar.get.mockReturnValue(undefined);
    expect(await redirectedTo(pay.simulatePayment("c1"))).toBe("/pay?expirou=1");
  });

  it("estorno: em branco estorna tudo; com valor, em centavos; valor inválido não sai", async () => {
    erpRequest.mockResolvedValue({});
    await pay.refundCharge("c1", IDLE, form({ amount: "", idempotencyKey: "estorno-123" }));
    expect(erpRequest).toHaveBeenLastCalledWith("/pay/charges/c1/refunds", { method: "POST", body: {}, token: API_KEY, headers: { "Idempotency-Key": "estorno-123" } });
    await pay.refundCharge("c1", IDLE, form({ amount: "20,00", idempotencyKey: "estorno-456" }));
    expect(erpRequest.mock.lastCall[1].body).toEqual({ amountCents: 2000 });
    erpRequest.mockClear();
    await expect(pay.refundCharge("c1", IDLE, form({ amount: "abc", idempotencyKey: "estorno-789" }))).resolves.toMatchObject({ status: "error" });
    expect(erpRequest).not.toHaveBeenCalled();
  });
});

describe("webhooks", () => {
  it("inspetor manda url nula; URL própria precisa ser https", async () => {
    erpRequest.mockResolvedValue({});
    await pay.saveWebhookSettings(IDLE, form({ destination: "inspector", url: "https://ignorada.example", failNext: "2" }));
    expect(erpRequest).toHaveBeenLastCalledWith("/pay/webhooks/settings", { method: "PATCH", body: { url: null, failNext: 2 }, token: API_KEY });

    erpRequest.mockClear();
    await expect(pay.saveWebhookSettings(IDLE, form({ destination: "url", url: "http://example.com", failNext: "0" }))).resolves.toMatchObject({ fieldErrors: { url: expect.any(String) } });
    expect(erpRequest).not.toHaveBeenCalled();

    erpRequest.mockRejectedValueOnce(new ErpApiError(400, "validation_error", "endereço interno não é aceito"));
    await expect(pay.saveWebhookSettings(IDLE, form({ destination: "url", url: "https://10.0.0.1/x", failNext: "0" }))).resolves.toMatchObject({
      fieldErrors: { url: "endereço interno não é aceito" },
    });
  });

  it("reenvio: entregue vira sucesso; recusado mostra o motivo", async () => {
    erpRequest.mockResolvedValueOnce({ status: "delivered" });
    await expect(pay.retryDelivery("d1")).resolves.toMatchObject({ status: "success" });
    erpRequest.mockResolvedValueOnce({ status: "failed", lastError: "o destino respondeu HTTP 500" });
    await expect(pay.retryDelivery("d1")).resolves.toEqual({ status: "error", message: "o destino respondeu HTTP 500" });
  });
});
