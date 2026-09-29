import { IDLE } from "./action-state";

jest.mock("server-only", () => ({}));

const redirect = jest.fn((url: string) => {
  throw Object.assign(new Error("NEXT_REDIRECT"), { url });
});
jest.mock("next/navigation", () => ({ redirect: (url: string) => redirect(url) }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));
jest.mock("next/headers", () => ({ headers: async () => new Headers({ host: "douglas-szapak.vercel.app", "x-forwarded-proto": "https" }) }));

const erpRequest = jest.fn();
jest.mock("./client", () => {
  const actual = jest.requireActual("./client");
  return { ...actual, erpRequest: (...args: unknown[]) => erpRequest(...args) };
});

const saveSession = jest.fn();
const clearSession = jest.fn();
const getSession = jest.fn();
jest.mock("./session", () => ({
  saveSession: (...args: unknown[]) => saveSession(...args),
  clearSession: () => clearSession(),
  getSession: () => getSession(),
}));

import * as accounts from "./account-actions";
import { ErpApiError } from "./client";
import * as queries from "./queries";

const ID = "b".repeat(24);
const TOKEN = "a".repeat(43);
const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};
const redirectedTo = (promise: Promise<unknown>) => promise.then(() => undefined, (error: { url?: string }) => error.url);
const session = { kind: "account", token: "t", role: "admin", workspace: { id: ID, name: "Mercado" }, expiresAt: "2099-01-01T00:00:00Z", user: { id: ID, name: "Dono", email: "d@x.com", isOwner: true } };

beforeEach(() => jest.clearAllMocks());

describe("entrar", () => {
  it("login certo salva a sessão e vai ao dashboard", async () => {
    erpRequest.mockResolvedValueOnce(session);
    expect(await redirectedTo(accounts.login(IDLE, form({ email: " Dono@X.com ", password: "senha-certa-123" })))).toBe("/erp/dashboard");
    expect(erpRequest).toHaveBeenCalledWith("/erp/auth/login", { method: "POST", body: { email: "dono@x.com", password: "senha-certa-123" }, anonymous: true });
    expect(saveSession).toHaveBeenCalledWith(session);
  });

  it("login errado vira mensagem na tela (não é sessão vencida)", async () => {
    erpRequest.mockRejectedValueOnce(new ErpApiError(401, "unauthorized", "E-mail ou senha inválidos"));
    await expect(accounts.login(IDLE, form({ email: "x@x.com", password: "errada" }))).resolves.toEqual({ status: "error", message: "E-mail ou senha inválidos" });
    expect(clearSession).not.toHaveBeenCalled();

    erpRequest.mockRejectedValueOnce(new ErpApiError(429, "rate_limited", "Muitas tentativas"));
    await expect(accounts.login(IDLE, form({ email: "x@x.com", password: "errada" }))).resolves.toMatchObject({ message: "Muitas tentativas" });
    await expect(accounts.login(IDLE, form({ email: "nao-e-email", password: "" }))).resolves.toMatchObject({ status: "error" });
  });

  it("instalação confere as senhas e vai ao painel do dono", async () => {
    const fields = { token: "token-de-instalacao-123", name: "Dono", email: "d@x.com", companyName: "Mercado", password: "senha-forte-123", confirm: "outra-senha-123" };
    await expect(accounts.setupOwner(IDLE, form(fields))).resolves.toMatchObject({ fieldErrors: { confirm: "repita a mesma senha" } });
    await expect(accounts.setupOwner(IDLE, form({ ...fields, password: "curta", confirm: "curta" }))).resolves.toMatchObject({ status: "error" });
    erpRequest.mockResolvedValueOnce(session);
    expect(await redirectedTo(accounts.setupOwner(IDLE, form({ ...fields, confirm: fields.password })))).toBe("/erp/admin");

    erpRequest.mockRejectedValueOnce(new ErpApiError(403, "forbidden", "Token de instalação inválido"));
    await expect(accounts.setupOwner(IDLE, form({ ...fields, confirm: fields.password }))).resolves.toMatchObject({ message: "Token de instalação inválido" });
  });

  it("aceitar convite e redefinir senha pelo link", async () => {
    const fields = { name: "Ana", password: "senha-da-ana-1", confirm: "senha-da-ana-1" };
    erpRequest.mockResolvedValueOnce(session);
    expect(await redirectedTo(accounts.acceptInvite(TOKEN, IDLE, form(fields)))).toBe("/erp/dashboard");
    expect(erpRequest).toHaveBeenLastCalledWith(`/erp/auth/invites/${TOKEN}/accept`, expect.objectContaining({ method: "POST", anonymous: true }));

    erpRequest.mockRejectedValueOnce(new ErpApiError(404, "not_found", "Convite inválido, já usado ou vencido"));
    await expect(accounts.acceptInvite(TOKEN, IDLE, form(fields))).resolves.toMatchObject({ message: "Convite inválido, já usado ou vencido" });
    await expect(accounts.acceptInvite(TOKEN, IDLE, form({ ...fields, name: "" }))).resolves.toMatchObject({ status: "error" });

    erpRequest.mockResolvedValueOnce(session);
    expect(await redirectedTo(accounts.resetPassword(TOKEN, IDLE, form(fields)))).toBe("/erp/dashboard");
    await expect(accounts.resetPassword(TOKEN, IDLE, form({ password: "curta", confirm: "curta" }))).resolves.toMatchObject({ status: "error" });
    await expect(accounts.resetPassword(TOKEN, IDLE, form({ password: "senha-longa-1", confirm: "x" }))).resolves.toMatchObject({ status: "error" });
  });

  it("trocar a própria senha", async () => {
    const fields = { current: "senha-atual-1", next: "senha-nova-12", confirm: "senha-nova-12" };
    erpRequest.mockResolvedValueOnce(session);
    await expect(accounts.changePassword(IDLE, form(fields))).resolves.toMatchObject({ status: "success" });
    expect(saveSession).toHaveBeenCalled();
    await expect(accounts.changePassword(IDLE, form({ ...fields, confirm: "x" }))).resolves.toMatchObject({ status: "error" });
    await expect(accounts.changePassword(IDLE, form({ ...fields, next: fields.current, confirm: fields.current }))).resolves.toMatchObject({ status: "error" });
    erpRequest.mockRejectedValueOnce(new ErpApiError(400, "validation_error", "Senha atual incorreta", { issues: [{ path: "current", message: "Senha atual incorreta" }] }));
    await expect(accounts.changePassword(IDLE, form(fields))).resolves.toMatchObject({ fieldErrors: { current: "Senha atual incorreta" } });
  });
});

describe("equipe e painel do dono", () => {
  it("convite devolve o link completo do site; o dono escolhe a empresa", async () => {
    erpRequest.mockResolvedValueOnce({ token: TOKEN, expiresAt: "2099-01-01T00:00:00Z" });
    await expect(accounts.createInvite("team", IDLE, form({ email: "Ana@X.com", role: "seller" }))).resolves.toEqual({
      status: "success",
      message: "Convite para ana@x.com criado.",
      link: `https://douglas-szapak.vercel.app/erp/convite/${TOKEN}`,
      expiresAt: "2099-01-01T00:00:00Z",
    });
    expect(erpRequest).toHaveBeenLastCalledWith("/erp/team/invites", { method: "POST", body: { email: "ana@x.com", role: "seller" } });

    erpRequest.mockResolvedValueOnce({ token: TOKEN, expiresAt: "2099-01-01T00:00:00Z" });
    await accounts.createInvite("owner", IDLE, form({ email: "b@x.com", role: "admin", workspaceId: ID }));
    expect(erpRequest).toHaveBeenLastCalledWith("/erp/owner/invites", { method: "POST", body: { email: "b@x.com", role: "admin", workspaceId: ID } });

    await expect(accounts.createInvite("team", IDLE, form({ email: "x", role: "chefe" }))).resolves.toMatchObject({ status: "error" });
    erpRequest.mockRejectedValueOnce(new ErpApiError(409, "conflict", "Já existe uma conta com este e-mail", { field: "email" }));
    await expect(accounts.createInvite("team", IDLE, form({ email: "a@x.com", role: "seller" }))).resolves.toMatchObject({ fieldErrors: { email: expect.any(String) } });
  });

  it("bloquear, trocar papel, link de senha e cancelar convite", async () => {
    erpRequest.mockResolvedValue({ token: TOKEN, expiresAt: "2099-01-01T00:00:00Z" });
    await expect(accounts.updateMember("team", ID, { status: "blocked" })).resolves.toMatchObject({ message: expect.stringMatching(/bloqueado/) });
    expect(erpRequest).toHaveBeenLastCalledWith(`/erp/team/members/${ID}`, { method: "PATCH", body: { status: "blocked" } });
    await accounts.updateMember("owner", ID, { role: "admin" });
    expect(erpRequest).toHaveBeenLastCalledWith(`/erp/owner/users/${ID}`, { method: "PATCH", body: { role: "admin" } });
    await expect(accounts.updateMember("team", ID, {})).resolves.toMatchObject({ status: "error" });

    await expect(accounts.createResetLink("owner", ID)).resolves.toMatchObject({ link: `https://douglas-szapak.vercel.app/erp/redefinir/${TOKEN}` });
    await expect(accounts.revokeInvite("team", ID)).resolves.toMatchObject({ status: "success" });
    await expect(accounts.createCompany(IDLE, form({ name: "Mercearia da Ana" }))).resolves.toMatchObject({ status: "success" });
    await expect(accounts.createCompany(IDLE, form({ name: "x" }))).resolves.toMatchObject({ status: "error" });

    erpRequest.mockRejectedValue(new ErpApiError(403, "forbidden", "Sem permissão"));
    await expect(accounts.createResetLink("team", ID)).resolves.toMatchObject({ status: "error", message: "Sem permissão" });
    await expect(accounts.revokeInvite("team", ID)).resolves.toMatchObject({ status: "error" });
    await expect(accounts.updateMember("team", ID, { role: "seller" })).resolves.toMatchObject({ status: "error" });
    await expect(accounts.createCompany(IDLE, form({ name: "Mercearia" }))).resolves.toMatchObject({ status: "error" });
    erpRequest.mockReset();
  });
});

describe("sessão de conta nas páginas", () => {
  it("papel vem da API a cada página; conta bloqueada vira 'sem sessão'", async () => {
    getSession.mockResolvedValue({ ...session, role: "admin" });
    erpRequest.mockResolvedValueOnce({ role: "seller", workspace: { id: ID, name: "Mercado" } });
    await expect(queries.requireSession()).resolves.toMatchObject({ kind: "account", role: "seller" });
  });

  it("sem sessão válida volta para a entrada avisando", async () => {
    getSession.mockResolvedValue({ ...session });
    erpRequest.mockRejectedValueOnce(new ErpApiError(401, "unauthorized", "x"));
    expect(await redirectedTo(queries.requireSession())).toBe("/erp?expirou=1");
  });

  it("páginas de equipe e painel exigem conta, admin e dono", async () => {
    getSession.mockResolvedValue({ kind: "demo", token: "t", role: "admin", workspace: { id: ID, name: "Demo" }, expiresAt: "2099-01-01T00:00:00Z" });
    expect(await redirectedTo(queries.requireAccount())).toBe("/erp/dashboard");
  });

  it("instalação disponível e prévia de links", async () => {
    erpRequest.mockResolvedValueOnce({ available: true });
    await expect(queries.setupAvailable()).resolves.toBe(true);
    erpRequest.mockRejectedValueOnce(new Error("rede"));
    await expect(queries.setupAvailable()).resolves.toBe(false);

    erpRequest.mockResolvedValueOnce({ email: "a@x.com" });
    await expect(queries.previewInvite(TOKEN)).resolves.toEqual({ email: "a@x.com" });
    erpRequest.mockRejectedValueOnce(new ErpApiError(404, "not_found", "x"));
    await expect(queries.previewReset(TOKEN)).resolves.toBeNull();
    erpRequest.mockRejectedValueOnce(new ErpApiError(500, "internal_error", "x"));
    await expect(queries.previewReset(TOKEN)).rejects.toMatchObject({ status: 500 });

    erpRequest.mockResolvedValue([]);
    await queries.getTeam();
    await queries.ownerOverview();
    await queries.ownerCompanies();
    await queries.ownerUsers();
    await queries.ownerInvites();
    expect(erpRequest).toHaveBeenLastCalledWith("/erp/owner/invites", { query: undefined });
  });
});
