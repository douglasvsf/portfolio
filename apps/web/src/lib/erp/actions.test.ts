import { IDLE } from "./action-state";

jest.mock("server-only", () => ({}));

const redirect = jest.fn((url: string) => {
  throw Object.assign(new Error("NEXT_REDIRECT"), { url });
});
jest.mock("next/navigation", () => ({ redirect: (url: string) => redirect(url) }));
jest.mock("next/cache", () => ({ revalidatePath: jest.fn() }));

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

import { ErpApiError } from "./client";
import * as actions from "./actions";
import * as queries from "./queries";

const ID = "a".repeat(24);
const form = (fields: Record<string, string>) => {
  const data = new FormData();
  for (const [key, value] of Object.entries(fields)) data.set(key, value);
  return data;
};
const redirectedTo = (promise: Promise<unknown>) => promise.then(() => undefined, (error: { url?: string }) => error.url);

beforeEach(() => jest.clearAllMocks());

describe("ações de sessão", () => {
  it("entrar na demo salva a sessão e vai ao dashboard; falha vira mensagem", async () => {
    erpRequest.mockResolvedValueOnce({ token: "t" });
    expect(await redirectedTo(actions.startDemo())).toBe("/erp/dashboard");
    expect(saveSession).toHaveBeenCalledWith({ token: "t" });

    erpRequest.mockRejectedValueOnce(new ErpApiError(503, "demo_full", "Demo lotada"));
    await expect(actions.startDemo()).resolves.toEqual({ status: "error", message: "Demo lotada" });
  });

  it("trocar papel valida o valor e sair limpa o cookie", async () => {
    await actions.switchRole(form({ role: "root" }));
    expect(erpRequest).not.toHaveBeenCalled();

    erpRequest.mockResolvedValueOnce({ token: "s" });
    await actions.switchRole(form({ role: "seller" }));
    expect(erpRequest).toHaveBeenCalledWith("/erp/sessions/role", { method: "POST", body: { role: "seller" } });

    expect(await redirectedTo(actions.leaveDemo())).toBe("/erp");
    expect(clearSession).toHaveBeenCalled();
  });

  it("sessão vencida na API apaga o cookie e volta à entrada", async () => {
    erpRequest.mockRejectedValueOnce(new ErpApiError(401, "unauthorized", "Sessão expirada"));
    expect(await redirectedTo(actions.deactivateProduct(ID))).toBe("/erp?expirou=1");
    expect(clearSession).toHaveBeenCalled();
  });

  it("erro que não é da API sobe (não vira mensagem)", async () => {
    erpRequest.mockRejectedValueOnce(new TypeError("bug"));
    await expect(actions.deleteCustomer(ID)).rejects.toThrow("bug");
  });
});

describe("produtos e estoque", () => {
  const product = { sku: "ARZ-5", name: "Arroz 5kg", category: "mercearia", unit: "un", price: "29,90", cost: "21,00", minStock: "10" };

  it("valida no BFF antes de chamar a API", async () => {
    const state = await actions.saveProduct(IDLE, form({ ...product, name: "", price: "abc" }));
    expect(state.status).toBe("error");
    expect(Object.keys((state.status === "error" && state.fieldErrors) || {})).toEqual(expect.arrayContaining(["name", "priceCents"]));
    expect(erpRequest).not.toHaveBeenCalled();
  });

  it("cria e edita com os valores convertidos para centavos", async () => {
    erpRequest.mockResolvedValue({});
    await expect(actions.saveProduct(IDLE, form(product))).resolves.toMatchObject({ status: "success" });
    expect(erpRequest).toHaveBeenLastCalledWith("/erp/products", { method: "POST", body: expect.objectContaining({ priceCents: 2990, costCents: 2100, minStock: 10 }) });
    await expect(actions.saveProduct(IDLE, form({ ...product, id: ID }))).resolves.toEqual({ status: "success", message: "Produto atualizado." });
    expect(erpRequest).toHaveBeenLastCalledWith(`/erp/products/${ID}`, expect.objectContaining({ method: "PATCH" }));
  });

  it("SKU repetido marca o campo que conflitou", async () => {
    erpRequest.mockRejectedValueOnce(new ErpApiError(409, "conflict", "SKU já existe", { field: "sku" }));
    await expect(actions.saveProduct(IDLE, form(product))).resolves.toEqual({ status: "error", message: "SKU já existe", fieldErrors: { sku: "SKU já existe" } });
  });

  it("desativar produto e movimentar estoque", async () => {
    erpRequest.mockResolvedValue(undefined);
    await expect(actions.deactivateProduct(ID)).resolves.toMatchObject({ status: "success" });

    await expect(actions.registerMovement(IDLE, form({ type: "in", productId: ID, quantity: "", reason: "" }))).resolves.toMatchObject({ status: "error" });
    await expect(actions.registerMovement(IDLE, form({ type: "in", productId: ID, quantity: "12", reason: "Compra NF 123" }))).resolves.toMatchObject({ status: "success" });
    expect(erpRequest).toHaveBeenLastCalledWith("/erp/stock/movements", { method: "POST", body: expect.objectContaining({ type: "in", quantity: 12 }) });
  });

  it("saída maior que o saldo devolve a lista de faltas", async () => {
    const shortages = [{ productId: ID, name: "Arroz", requested: 5, available: 2 }];
    erpRequest.mockRejectedValueOnce(new ErpApiError(409, "insufficient_stock", "Estoque insuficiente", shortages));
    await expect(actions.registerMovement(IDLE, form({ type: "out", productId: ID, quantity: "5", reason: "Perda" }))).resolves.toEqual({
      status: "error",
      message: "Estoque insuficiente",
      shortages,
    });
  });
});

describe("clientes", () => {
  const customer = { name: "Maria Souza", document: "529.982.247-25", email: "maria@exemplo.com.br" };

  it("CPF inválido não sai do BFF; válido cria e edita", async () => {
    await expect(actions.saveCustomer(IDLE, form({ ...customer, document: "111.111.111-11" }))).resolves.toMatchObject({ status: "error" });
    expect(erpRequest).not.toHaveBeenCalled();

    erpRequest.mockResolvedValue({});
    await expect(actions.saveCustomer(IDLE, form(customer))).resolves.toEqual({ status: "success", message: "Cliente cadastrado." });
    await expect(actions.saveCustomer(IDLE, form({ ...customer, id: ID }))).resolves.toEqual({ status: "success", message: "Cliente atualizado." });
    await expect(actions.deleteCustomer(ID)).resolves.toMatchObject({ status: "success" });
  });

  it("erro de validação da API vira erro por campo", async () => {
    erpRequest.mockRejectedValueOnce(new ErpApiError(400, "validation_error", "Dados inválidos", { issues: [{ path: "email", message: "E-mail inválido" }] }));
    await expect(actions.saveCustomer(IDLE, form(customer))).resolves.toEqual({ status: "error", message: "Dados inválidos", fieldErrors: { email: "E-mail inválido" } });
  });
});

describe("pedidos", () => {
  const payload = JSON.stringify({ customerId: ID, items: [{ productId: ID, quantity: 2 }], discountCents: 0 });

  it("payload quebrado ou vazio não chama a API", async () => {
    await expect(actions.createOrder(IDLE, form({ payload: "{" }))).resolves.toEqual({ status: "error", message: "Pedido inválido." });
    await expect(actions.createOrder(IDLE, form({ payload: JSON.stringify({ customerId: ID, items: [] }) }))).resolves.toMatchObject({ status: "error" });
    expect(erpRequest).not.toHaveBeenCalled();
  });

  it("cria e abre o pedido; erro da API vira mensagem", async () => {
    erpRequest.mockResolvedValueOnce({ id: "pedido1" });
    expect(await redirectedTo(actions.createOrder(IDLE, form({ payload })))).toBe("/erp/pedidos/pedido1?criado=1");

    erpRequest.mockRejectedValueOnce(new ErpApiError(404, "not_found", "Cliente não encontrado"));
    await expect(actions.createOrder(IDLE, form({ payload }))).resolves.toEqual({ status: "error", message: "Cliente não encontrado" });
  });

  it("confirmar e cancelar; ação desconhecida é rejeitada", async () => {
    await expect(actions.changeOrderStatus(IDLE, form({ id: ID, action: "delete" }))).resolves.toEqual({ status: "error", message: "Ação inválida." });
    erpRequest.mockResolvedValue({});
    await expect(actions.changeOrderStatus(IDLE, form({ id: ID, action: "confirm" }))).resolves.toMatchObject({ message: expect.stringContaining("confirmado") });
    await expect(actions.changeOrderStatus(IDLE, form({ id: ID, action: "cancel" }))).resolves.toEqual({ status: "success", message: "Pedido cancelado." });
    expect(erpRequest).toHaveBeenLastCalledWith(`/erp/orders/${ID}/cancel`, { method: "POST" });

    erpRequest.mockRejectedValueOnce(new ErpApiError(409, "invalid_state", "Pedido já cancelado"));
    await expect(actions.changeOrderStatus(IDLE, form({ id: ID, action: "cancel" }))).resolves.toMatchObject({ status: "error" });
  });
});

describe("PDV", () => {
  const sale = { items: [{ productId: ID, quantity: 2 }], payments: [{ method: "cash" as const, amountCents: 5000 }] };
  const KEY = "pdv-0123456789abcdef";

  it("manda a venda com a chave de idempotência no header", async () => {
    erpRequest.mockResolvedValueOnce({ id: "v1", number: 49 });
    await expect(actions.finalizeSale(sale, KEY)).resolves.toEqual({ status: "success", order: { id: "v1", number: 49 } });
    expect(erpRequest).toHaveBeenCalledWith("/erp/pos/sales", { method: "POST", body: { ...sale, discountCents: 0 }, headers: { "idempotency-key": KEY } });
  });

  it("venda vazia, chave inválida e falta de estoque", async () => {
    await expect(actions.finalizeSale({ ...sale, items: [] }, KEY)).resolves.toMatchObject({ status: "error" });
    await expect(actions.finalizeSale(sale, "curta")).resolves.toMatchObject({ status: "error", message: expect.stringMatching(/recarregue/) });
    expect(erpRequest).not.toHaveBeenCalled();

    const shortages = [{ productId: ID, name: "Arroz", requested: 2, available: 1 }];
    erpRequest.mockRejectedValueOnce(new ErpApiError(409, "insufficient_stock", "Estoque insuficiente: Arroz", shortages));
    await expect(actions.finalizeSale(sale, KEY)).resolves.toEqual({ status: "error", message: "Estoque insuficiente: Arroz", shortages });
  });
});

describe("leituras das páginas", () => {
  it("repassa filtros e devolve só os itens nos seletores", async () => {
    erpRequest.mockResolvedValue({ items: [{ id: 1 }], total: 1 });
    await expect(queries.allProducts()).resolves.toEqual([{ id: 1 }]);
    expect(erpRequest).toHaveBeenLastCalledWith("/erp/products", { query: { pageSize: 100 } });
    await queries.allCustomers();
    await queries.listMovements({ type: "in" });
    await queries.listOrders({ status: "draft" });
    await queries.getDashboard();
    expect(erpRequest).toHaveBeenLastCalledWith("/erp/dashboard", { query: undefined });
  });

  it("sessão vencida redireciona; outros erros sobem", async () => {
    erpRequest.mockRejectedValueOnce(new ErpApiError(401, "unauthorized", "x"));
    expect(await redirectedTo(queries.getDashboard())).toBe("/erp?expirou=1");
    erpRequest.mockRejectedValueOnce(new ErpApiError(500, "internal_error", "x"));
    await expect(queries.listOrders({})).rejects.toMatchObject({ status: 500 });
  });

  it("pedido inexistente vira null (404 da página)", async () => {
    erpRequest.mockResolvedValueOnce({ id: ID });
    await expect(queries.getOrder(ID)).resolves.toEqual({ id: ID });
    erpRequest.mockRejectedValueOnce(new ErpApiError(404, "not_found", "x"));
    await expect(queries.getOrder(ID)).resolves.toBeNull();
    erpRequest.mockRejectedValueOnce(new ErpApiError(401, "unauthorized", "x"));
    expect(await redirectedTo(queries.getOrder(ID))).toBe("/erp?expirou=1");
    erpRequest.mockRejectedValueOnce(new ErpApiError(500, "internal_error", "x"));
    await expect(queries.getOrder(ID)).rejects.toMatchObject({ status: 500 });
  });

  it("páginas exigem sessão", async () => {
    getSession.mockResolvedValueOnce(null);
    expect(await redirectedTo(queries.requireSession())).toBe("/erp");
    getSession.mockResolvedValueOnce({ role: "admin" });
    await expect(queries.requireSession()).resolves.toEqual({ role: "admin" });
  });
});
