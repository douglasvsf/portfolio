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

import { ErpApiError } from "../erp/client";
import * as agentActions from "./actions";
import { decodeAgentSession } from "./session";

const IDLE: agentActions.AgentActionState = { status: "idle" };
const EXPIRES = "2099-01-01T00:00:00.000Z";
const stored = Buffer.from(JSON.stringify({ token: "token-do-agente", expiresAt: EXPIRES })).toString("base64url");
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

describe("conversa com o Kaiju Agent", () => {
  it("começar guarda o token num cookie httpOnly restrito a /agente", async () => {
    erpRequest.mockResolvedValueOnce({ token: "novo-token", expiresAt: EXPIRES, erp: { workspaceName: "Mercado" }, pay: null });
    expect(await redirectedTo(agentActions.startConversation())).toBe("/agente");
    expect(erpRequest).toHaveBeenCalledWith("/agent/sessions", { method: "POST", anonymous: true });
    const [name, value, options] = cookieJar.set.mock.calls[0];
    expect(name).toBe("agent_session");
    expect(options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/agente" });
    expect(decodeAgentSession(value)).toEqual({ token: "novo-token", expiresAt: EXPIRES });
  });

  it("limite e lotação viram mensagem; nada de cookie", async () => {
    erpRequest.mockRejectedValueOnce(new ErpApiError(429, "rate_limited", "x"));
    await expect(agentActions.startConversation()).resolves.toMatchObject({ message: expect.stringContaining("várias conversas") });
    erpRequest.mockRejectedValueOnce(new ErpApiError(503, "demo_full", "x"));
    await expect(agentActions.startConversation()).resolves.toMatchObject({ message: expect.stringContaining("Muitas demonstrações") });
    expect(cookieJar.set).not.toHaveBeenCalled();
  });

  it("mensagem vai com o token da conversa; vazia ou longa não sai e o texto volta para o campo", async () => {
    erpRequest.mockResolvedValueOnce({ id: "t1" });
    await expect(agentActions.sendMessage(IDLE, form({ message: "  Qual o saldo?  " }))).resolves.toEqual(IDLE);
    expect(erpRequest).toHaveBeenCalledWith("/agent/messages", { method: "POST", body: { message: "Qual o saldo?" }, token: "token-do-agente" });

    erpRequest.mockClear();
    await expect(agentActions.sendMessage(IDLE, form({ message: "   " }))).resolves.toMatchObject({ status: "error", message: "escreva o que você quer" });
    const long = "a".repeat(501);
    await expect(agentActions.sendMessage(IDLE, form({ message: long }))).resolves.toMatchObject({ status: "error", draft: long });
    expect(erpRequest).not.toHaveBeenCalled();
  });

  it("erro da API mantém o texto digitado; IA fora do ar vira a mensagem dela", async () => {
    erpRequest.mockRejectedValueOnce(new ErpApiError(409, "conflict", "O agente ainda está respondendo a mensagem anterior."));
    await expect(agentActions.sendMessage(IDLE, form({ message: "oi" }))).resolves.toEqual({ status: "error", message: "O agente ainda está respondendo a mensagem anterior.", draft: "oi" });
    erpRequest.mockRejectedValueOnce(new ErpApiError(503, "service_unavailable", "Kaiju Agent indisponível: o modelo de IA não está configurado."));
    await expect(agentActions.sendMessage(IDLE, form({ message: "oi" }))).resolves.toMatchObject({ message: expect.stringContaining("não está configurado") });
    erpRequest.mockRejectedValueOnce(new Error("rede"));
    await expect(agentActions.sendMessage(IDLE, form({ message: "oi" }))).resolves.toMatchObject({ message: expect.stringContaining("Não consegui falar") });
  });

  it("confirmar e recusar mandam a decisão; conversa vencida volta para a entrada", async () => {
    erpRequest.mockResolvedValue({});
    await agentActions.confirmAction("turno-1", true);
    expect(erpRequest).toHaveBeenLastCalledWith("/agent/turns/turno-1/confirm", { method: "POST", body: { approve: true }, token: "token-do-agente" });
    await agentActions.confirmAction("turno-1", false);
    expect(erpRequest.mock.lastCall[1].body).toEqual({ approve: false });

    erpRequest.mockRejectedValueOnce(new ErpApiError(401, "unauthorized", "x"));
    expect(await redirectedTo(agentActions.confirmAction("turno-1", true))).toBe("/agente?expirou=1");
    expect(cookieJar.delete).toHaveBeenCalledWith({ name: "agent_session", path: "/agente" });

    cookieJar.get.mockReturnValue(undefined);
    expect(await redirectedTo(agentActions.sendMessage(IDLE, form({ message: "oi" })))).toBe("/agente?expirou=1");
  });

  it("cookie adulterado ou vencido não vale", () => {
    const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
    expect(decodeAgentSession("lixo")).toBeNull();
    expect(decodeAgentSession(encode({ expiresAt: EXPIRES }))).toBeNull();
    expect(decodeAgentSession(encode({ token: "t", expiresAt: "2020-01-01T00:00:00Z" }))).toBeNull();
  });
});
