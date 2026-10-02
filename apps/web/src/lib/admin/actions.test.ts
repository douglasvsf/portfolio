jest.mock("server-only", () => ({}));

const redirect = jest.fn((url: string) => {
  throw Object.assign(new Error("NEXT_REDIRECT"), { url });
});
jest.mock("next/navigation", () => ({ redirect: (url: string) => redirect(url) }));
const revalidatePath = jest.fn();
jest.mock("next/cache", () => ({ revalidatePath: (path: string) => revalidatePath(path) }));

const cookieJar = { set: jest.fn(), delete: jest.fn(), get: jest.fn() };
jest.mock("next/headers", () => ({ cookies: async () => cookieJar, headers: async () => new Headers() }));

const erpRequest = jest.fn();
jest.mock("../erp/client", () => {
  const actual = jest.requireActual("../erp/client");
  return { ...actual, erpRequest: (...args: unknown[]) => erpRequest(...args) };
});

import { ErpApiError } from "../erp/client";
import * as admin from "./actions";
import { adminPanel } from "./queries";
import { decodeAdminSession } from "./session";

const IDLE: admin.AdminState = { status: "idle" };
const ID = "b".repeat(24);
const EXPIRES = "2099-01-01T00:00:00.000Z";
const account = (isOwner: boolean) => ({
  kind: "account",
  token: "token-da-api",
  role: "admin",
  workspace: { id: ID, name: "Mercado" },
  expiresAt: EXPIRES,
  user: { id: ID, name: "Douglas", email: "dono@exemplo.com.br", isOwner },
});
const stored = Buffer.from(JSON.stringify({ token: "token-da-api", name: "Douglas", email: "dono@exemplo.com.br", expiresAt: EXPIRES })).toString("base64url");
const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};
const redirectedTo = (promise: Promise<unknown>) => promise.then(() => undefined, (error: { url?: string }) => error.url);
const loggedIn = () => cookieJar.get.mockReturnValue({ value: stored });

beforeEach(() => {
  jest.clearAllMocks();
  cookieJar.get.mockReturnValue(undefined);
});

describe("painel do site — entrar", () => {
  it("o dono entra: cookie próprio, httpOnly e restrito a /admin", async () => {
    erpRequest.mockResolvedValueOnce(account(true));
    expect(await redirectedTo(admin.adminLogin(IDLE, form({ email: " Dono@Exemplo.com.br ", password: "senha-forte-do-dono" })))).toBe("/admin");
    expect(erpRequest).toHaveBeenCalledWith("/erp/auth/login", { method: "POST", body: { email: "dono@exemplo.com.br", password: "senha-forte-do-dono" }, anonymous: true });
    const [name, value, options] = cookieJar.set.mock.calls[0];
    expect(name).toBe("admin_session");
    expect(options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/admin" });
    expect(decodeAdminSession(value)).toEqual({ token: "token-da-api", name: "Douglas", email: "dono@exemplo.com.br", expiresAt: EXPIRES });
  });

  it("conta que não é a do dono recebe a mesma resposta de senha errada e não ganha sessão", async () => {
    erpRequest.mockResolvedValueOnce(account(false));
    const notOwner = await admin.adminLogin(IDLE, form({ email: "vendedor@exemplo.com.br", password: "senha-do-vendedor" }));

    erpRequest.mockRejectedValueOnce(new ErpApiError(401, "unauthorized", "E-mail ou senha inválidos"));
    const wrong = await admin.adminLogin(IDLE, form({ email: "dono@exemplo.com.br", password: "senha-errada-123" }));

    expect(notOwner).toEqual(wrong);
    expect(notOwner).toEqual({ status: "error", message: "E-mail ou senha inválidos." });
    expect(cookieJar.set).not.toHaveBeenCalled();
  });

  it("limite de tentativas, API fora do ar e campos vazios viram mensagem, sem detalhe interno", async () => {
    erpRequest.mockRejectedValueOnce(new ErpApiError(429, "rate_limited", "x"));
    await expect(admin.adminLogin(IDLE, form({ email: "a@b.co", password: "qualquer-senha" }))).resolves.toMatchObject({ message: expect.stringContaining("Muitas tentativas") });

    erpRequest.mockRejectedValueOnce(new ErpApiError(503, "internal_error", "ERP_API_URL não configurada"));
    const down = await admin.adminLogin(IDLE, form({ email: "a@b.co", password: "qualquer-senha" }));
    expect(down).toMatchObject({ status: "error" });
    expect(JSON.stringify(down)).not.toContain("ERP_API_URL");

    await expect(admin.adminLogin(IDLE, form({ email: "", password: "" }))).resolves.toEqual({ status: "error", message: "Informe e-mail e senha." });
    expect(erpRequest).toHaveBeenCalledTimes(2);
  });

  it("sair apaga o cookie", async () => {
    expect(await redirectedTo(admin.adminLogout())).toBe("/admin");
    expect(cookieJar.delete).toHaveBeenCalledWith({ name: "admin_session", path: "/admin" });
  });
});

describe("painel do site — mensagens", () => {
  it("sem sessão o painel não carrega nem chama a API", async () => {
    await expect(adminPanel()).resolves.toBeNull();
    expect(await redirectedTo(admin.setMessageStatus(ID, "read"))).toBe("/admin");
    expect(await redirectedTo(admin.deleteMessage(ID))).toBe("/admin");
    expect(erpRequest).not.toHaveBeenCalled();
  });

  it("cookie adulterado ou vencido não vale como sessão", () => {
    const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
    expect(decodeAdminSession("lixo")).toBeNull();
    expect(decodeAdminSession(encode({ name: "x", expiresAt: EXPIRES }))).toBeNull();
    expect(decodeAdminSession(encode({ token: "t", name: "x", email: "e", expiresAt: "2020-01-01T00:00:00Z" }))).toBeNull();
    expect(decodeAdminSession(encode({ token: "t", name: "x", email: "e", expiresAt: "não é data" }))).toBeNull();
  });

  it("com sessão, lê e altera usando o token do painel", async () => {
    loggedIn();
    erpRequest.mockResolvedValueOnce([{ id: ID, status: "new" }]);
    await expect(adminPanel()).resolves.toMatchObject({ session: { name: "Douglas" }, messages: [{ id: ID }] });
    expect(erpRequest).toHaveBeenLastCalledWith("/admin/messages", { token: "token-da-api" });

    erpRequest.mockResolvedValueOnce({});
    await expect(admin.setMessageStatus(ID, "read")).resolves.toEqual(IDLE);
    expect(erpRequest).toHaveBeenLastCalledWith(`/admin/messages/${ID}`, { method: "PATCH", body: { status: "read" }, token: "token-da-api" });

    erpRequest.mockResolvedValueOnce(undefined);
    await expect(admin.deleteMessage(ID)).resolves.toEqual(IDLE);
    expect(erpRequest).toHaveBeenLastCalledWith(`/admin/messages/${ID}`, { method: "DELETE", token: "token-da-api" });
    expect(revalidatePath).toHaveBeenCalledWith("/admin");
  });

  it("sessão recusada pela API volta ao login; outros erros viram mensagem", async () => {
    loggedIn();
    erpRequest.mockRejectedValueOnce(new ErpApiError(401, "unauthorized", "x"));
    await expect(adminPanel()).resolves.toBeNull();

    erpRequest.mockRejectedValueOnce(new ErpApiError(401, "unauthorized", "x"));
    expect(await redirectedTo(admin.deleteMessage(ID))).toBe("/admin");
    expect(cookieJar.delete).toHaveBeenCalled();

    erpRequest.mockRejectedValueOnce(new ErpApiError(404, "not_found", "x"));
    await expect(admin.deleteMessage(ID)).resolves.toMatchObject({ status: "error", message: expect.stringContaining("não existe mais") });

    erpRequest.mockRejectedValueOnce(new Error("rede"));
    await expect(admin.setMessageStatus(ID, "new")).resolves.toMatchObject({ status: "error" });
  });
});
