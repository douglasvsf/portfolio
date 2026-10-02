jest.mock("server-only", () => ({}));

const erpRequest = jest.fn();
jest.mock("../erp/client", () => {
  const actual = jest.requireActual("../erp/client");
  return { ...actual, erpRequest: (...args: unknown[]) => erpRequest(...args) };
});
jest.mock("../erp/session", () => ({ getSession: jest.fn() }));
jest.mock("next/headers", () => ({ headers: async () => new Headers() }));

import { ErpApiError } from "../erp/client";
import { sendContactMessage, type ContactState } from "./actions";

const IDLE: ContactState = { status: "idle" };
const VALID = { kind: "freelance", name: "Marina Costa", email: " Marina@Exemplo.com.br ", company: "", message: "Preciso de um e-commerce com catálogo e checkout.", locale: "pt-BR", website: "" };
const KEPT = { name: "Marina Costa", email: "Marina@Exemplo.com.br", company: "", message: VALID.message };
const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};

beforeEach(() => jest.clearAllMocks());

describe("formulário de contato", () => {
  it("mensagem válida vai para a API, sem sessão, com o e-mail normalizado e sem campos vazios", async () => {
    erpRequest.mockResolvedValueOnce({ received: true });
    await expect(sendContactMessage(IDLE, form(VALID))).resolves.toEqual({ status: "success" });
    expect(erpRequest).toHaveBeenCalledWith("/contact", {
      method: "POST",
      anonymous: true,
      body: { kind: "freelance", name: "Marina Costa", email: "marina@exemplo.com.br", message: VALID.message, locale: "pt-BR" },
    });
  });

  it("campos inválidos não chegam à API e voltam marcados", async () => {
    await expect(sendContactMessage(IDLE, form({ ...VALID, name: "M", email: "nao-e-email", message: "curta" }))).resolves.toEqual({
      status: "error",
      reason: "invalid",
      fields: ["name", "email", "message"],
      // O que foi digitado volta, para o formulário não esvaziar.
      values: { name: "M", email: "nao-e-email", company: "", message: "curta" },
    });
    await expect(sendContactMessage(IDLE, form({ ...VALID, kind: "spam" }))).resolves.toEqual({ status: "error", reason: "invalid", fields: [], values: KEPT });
    await expect(sendContactMessage(IDLE, new FormData())).resolves.toMatchObject({ status: "error", reason: "invalid" });
    expect(erpRequest).not.toHaveBeenCalled();
  });

  it("a armadilha para robôs segue para a API, que descarta em silêncio", async () => {
    erpRequest.mockResolvedValueOnce({ received: true });
    await sendContactMessage(IDLE, form({ ...VALID, website: "http://spam.example" }));
    expect(erpRequest.mock.calls[0][1].body.website).toBe("http://spam.example");
  });

  it("erros da API viram um código, sem vazar detalhe interno", async () => {
    erpRequest.mockRejectedValueOnce(new ErpApiError(429, "rate_limited", "Muitas mensagens"));
    await expect(sendContactMessage(IDLE, form(VALID))).resolves.toEqual({ status: "error", reason: "rateLimited", values: KEPT });

    erpRequest.mockRejectedValueOnce(new ErpApiError(503, "rate_limited", "Caixa cheia"));
    await expect(sendContactMessage(IDLE, form(VALID))).resolves.toEqual({ status: "error", reason: "unavailable", values: KEPT });

    erpRequest.mockRejectedValueOnce(new ErpApiError(400, "validation_error", "inválido"));
    await expect(sendContactMessage(IDLE, form(VALID))).resolves.toEqual({ status: "error", reason: "invalid", values: KEPT });

    erpRequest.mockRejectedValueOnce(new ErpApiError(503, "internal_error", "ERP_API_URL não configurada"));
    await expect(sendContactMessage(IDLE, form(VALID))).resolves.toEqual({ status: "error", reason: "unavailable", values: KEPT });

    erpRequest.mockRejectedValueOnce(new Error("falha de rede"));
    await expect(sendContactMessage(IDLE, form(VALID))).resolves.toEqual({ status: "error", reason: "unavailable", values: KEPT });
  });
});
