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
import { adminPanel, adminSetupAvailable } from "./queries";
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
const stored = Buffer.from(JSON.stringify({ token: "token-da-api", name: "Douglas", email: "painel@exemplo.com.br", expiresAt: EXPIRES })).toString("base64url");
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

const panelSession = { token: "token-da-api", name: "Douglas", email: "painel@exemplo.com.br", expiresAt: EXPIRES };
const SETUP = { ownerEmail: "dono@exemplo.com.br", ownerPassword: "senha-forte-do-dono", email: "Painel@Exemplo.com.br", password: "senha-so-do-painel", confirm: "senha-so-do-painel" };

describe("painel do site — entrar", () => {
  it("login do painel: cookie próprio, httpOnly e restrito a /admin", async () => {
    erpRequest.mockResolvedValueOnce(panelSession);
    expect(await redirectedTo(admin.adminLogin(IDLE, form({ email: " Painel@Exemplo.com.br ", password: "senha-so-do-painel" })))).toBe("/admin");
    expect(erpRequest).toHaveBeenCalledWith("/admin/auth/login", { method: "POST", body: { email: "painel@exemplo.com.br", password: "senha-so-do-painel" }, anonymous: true });
    const [name, value, options] = cookieJar.set.mock.calls[0];
    expect(name).toBe("admin_session");
    expect(options).toMatchObject({ httpOnly: true, sameSite: "lax", path: "/admin" });
    expect(decodeAdminSession(value)).toEqual(panelSession);
  });

  it("senha errada, limite de tentativas, API fora do ar e campos vazios viram mensagem, sem sessão nem detalhe interno", async () => {
    erpRequest.mockRejectedValueOnce(new ErpApiError(401, "unauthorized", "E-mail ou senha inválidos"));
    await expect(admin.adminLogin(IDLE, form({ email: "a@b.co", password: "senha-errada-123" }))).resolves.toEqual({ status: "error", message: "E-mail ou senha inválidos." });

    erpRequest.mockRejectedValueOnce(new ErpApiError(429, "rate_limited", "x"));
    await expect(admin.adminLogin(IDLE, form({ email: "a@b.co", password: "qualquer-senha" }))).resolves.toMatchObject({ message: expect.stringContaining("Muitas tentativas") });

    erpRequest.mockRejectedValueOnce(new ErpApiError(503, "internal_error", "ERP_API_URL não configurada"));
    const down = await admin.adminLogin(IDLE, form({ email: "a@b.co", password: "qualquer-senha" }));
    expect(down).toMatchObject({ status: "error" });
    expect(JSON.stringify(down)).not.toContain("ERP_API_URL");

    await expect(admin.adminLogin(IDLE, form({ email: "", password: "" }))).resolves.toEqual({ status: "error", message: "Informe e-mail e senha." });
    expect(erpRequest).toHaveBeenCalledTimes(3);
    expect(cookieJar.set).not.toHaveBeenCalled();
  });

  it("sair apaga o cookie", async () => {
    expect(await redirectedTo(admin.adminLogout())).toBe("/admin");
    expect(cookieJar.delete).toHaveBeenCalledWith({ name: "admin_session", path: "/admin" });
  });
});

describe("painel do site — cadastro único do login", () => {
  it("confirma a conta de dono, cria o login com o token dela e já entra", async () => {
    erpRequest.mockResolvedValueOnce(account(true)).mockResolvedValueOnce(panelSession);
    expect(await redirectedTo(admin.adminSetup(IDLE, form(SETUP)))).toBe("/admin");
    expect(erpRequest).toHaveBeenNthCalledWith(1, "/erp/auth/login", { method: "POST", body: { email: "dono@exemplo.com.br", password: "senha-forte-do-dono" }, anonymous: true });
    expect(erpRequest).toHaveBeenNthCalledWith(2, "/admin/auth/setup", { method: "POST", body: { email: "painel@exemplo.com.br", password: "senha-so-do-painel" }, token: "token-da-api" });
    expect(decodeAdminSession(cookieJar.set.mock.calls[0][1])).toEqual(panelSession);
  });

  it("campos inválidos não chegam à API; os e-mails voltam, as senhas não", async () => {
    const mismatch = await admin.adminSetup(IDLE, form({ ...SETUP, confirm: "outra-senha-qualquer" }));
    expect(mismatch).toMatchObject({ status: "error", message: "As senhas não conferem.", fieldErrors: { confirm: expect.any(String) }, values: { ownerEmail: "dono@exemplo.com.br", email: "Painel@Exemplo.com.br" } });
    expect(JSON.stringify(mismatch)).not.toContain("senha-");

    await expect(admin.adminSetup(IDLE, form({ ...SETUP, password: "curta", confirm: "curta" }))).resolves.toMatchObject({ fieldErrors: { password: expect.stringContaining("10 caracteres") } });
    await expect(admin.adminSetup(IDLE, form({ ...SETUP, email: "nao-e-email" }))).resolves.toMatchObject({ fieldErrors: { email: expect.any(String) } });
    await expect(admin.adminSetup(IDLE, form({ ...SETUP, ownerPassword: "" }))).resolves.toMatchObject({ status: "error" });
    expect(erpRequest).not.toHaveBeenCalled();
  });

  it("conta de dono errada, conta que não é a do dono e cadastro já feito não criam sessão", async () => {
    erpRequest.mockRejectedValueOnce(new ErpApiError(401, "unauthorized", "E-mail ou senha inválidos"));
    const wrong = await admin.adminSetup(IDLE, form(SETUP));

    erpRequest.mockResolvedValueOnce(account(false)).mockRejectedValueOnce(new ErpApiError(403, "forbidden", "x"));
    const notOwner = await admin.adminSetup(IDLE, form(SETUP));
    expect(notOwner).toEqual(wrong);
    expect(wrong).toMatchObject({ message: "A conta de dono informada não confere." });

    erpRequest.mockResolvedValueOnce(account(true)).mockRejectedValueOnce(new ErpApiError(409, "conflict", "O login do painel já foi criado"));
    await expect(admin.adminSetup(IDLE, form(SETUP))).resolves.toMatchObject({ message: expect.stringContaining("já foi criado") });

    erpRequest.mockRejectedValueOnce(new Error("rede"));
    await expect(admin.adminSetup(IDLE, form(SETUP))).resolves.toMatchObject({ status: "error" });
    expect(cookieJar.set).not.toHaveBeenCalled();
  });

  it("o cadastro só é oferecido quando a API diz que está disponível", async () => {
    erpRequest.mockResolvedValueOnce({ available: true });
    await expect(adminSetupAvailable()).resolves.toBe(true);
    expect(erpRequest).toHaveBeenLastCalledWith("/admin/auth/setup", { anonymous: true });
    erpRequest.mockResolvedValueOnce({ available: false });
    await expect(adminSetupAvailable()).resolves.toBe(false);
    erpRequest.mockRejectedValueOnce(new ErpApiError(503, "internal_error", "x"));
    await expect(adminSetupAvailable()).resolves.toBe(false);
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
