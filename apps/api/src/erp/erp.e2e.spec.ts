import type { INestApplication } from "@nestjs/common";
import { getConnectionToken } from "@nestjs/mongoose";
import { JwtService } from "@nestjs/jwt";
import { Test } from "@nestjs/testing";
import { MongoMemoryReplSet } from "mongodb-memory-server";
import type { Connection } from "mongoose";
import request from "supertest";
import type { erp } from "@portfolio/shared";
import { configureApp } from "../app.factory";
import { AppModule } from "../app.module";

/**
 * API do ERP de ponta a ponta: app real (mesma configuração do main.ts) contra
 * um MongoDB em memória com replica set — necessário para transações.
 */
jest.setTimeout(120_000);

let replSet: MongoMemoryReplSet;
let app: INestApplication;
let ipCounter = 0;

/** Cada demo "vem" de um visitante diferente (o limite é 5 por hora por IP). */
async function newDemo(): Promise<erp.DemoSession> {
  const response = await request(app.getHttpServer())
    .post("/erp/sessions/demo")
    .set("x-bff-key", "test-bff-key")
    .set("x-client-ip", `10.0.0.${++ipCounter}`)
    .expect(201);
  return response.body;
}

const api = (token: string) => ({
  get: (path: string) => request(app.getHttpServer()).get(path).set("Authorization", `Bearer ${token}`),
  post: (path: string, body?: object) => request(app.getHttpServer()).post(path).set("Authorization", `Bearer ${token}`).send(body),
  patch: (path: string, body: object) => request(app.getHttpServer()).patch(path).set("Authorization", `Bearer ${token}`).send(body),
  delete: (path: string) => request(app.getHttpServer()).delete(path).set("Authorization", `Bearer ${token}`),
});

beforeAll(async () => {
  replSet = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
  process.env.MONGODB_URI = replSet.getUri("erp-test");
  process.env.ERP_JWT_SECRET = "test-secret";
  process.env.ERP_BFF_KEY = "test-bff-key";
  process.env.ERP_MAX_WORKSPACES = "50";
  process.env.ERP_SETUP_TOKEN = "token-de-instalacao-do-teste";

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ logger: false });
  configureApp(app);
  await app.init();
  // Índices (únicos e TTL) criados antes dos testes de duplicidade.
  await app.get<Connection>(getConnectionToken()).syncIndexes();
});

afterAll(async () => {
  await app?.close();
  await replSet?.stop();
});

describe("sessão demo", () => {
  it("cria uma empresa isolada com dados de mercado e token de admin", async () => {
    const demo = await newDemo();
    expect(demo).toMatchObject({ role: "admin", workspace: { name: expect.stringMatching(/^Mercado Godzilla #/) } });
    expect(new Date(demo.expiresAt).getTime() - Date.now()).toBeGreaterThan(23 * 3_600_000);

    const me = await api(demo.token).get("/erp/me").expect(200);
    expect(me.body).toMatchObject({ role: "admin", workspace: { id: demo.workspace.id } });

    const products = await api(demo.token).get("/erp/products?pageSize=100").expect(200);
    expect(products.body.total).toBe(40);
  });

  it("sem token ou com token inválido: 401 no formato padrão", async () => {
    const missing = await request(app.getHttpServer()).get("/erp/products").expect(401);
    expect(missing.body).toMatchObject({ error: "unauthorized", message: expect.any(String) });
    await api("token.invalido").get("/erp/products").expect(401);
  });

  it("troca de papel mantém a empresa", async () => {
    const demo = await newDemo();
    const seller = await api(demo.token).post("/erp/sessions/role", { role: "seller" }).expect(200);
    expect(seller.body).toMatchObject({ role: "seller", workspace: { id: demo.workspace.id } });
  });
});

describe("permissões por papel", () => {
  it("vendedor consulta e cadastra cliente/pedido, mas não mexe em produto nem estoque", async () => {
    const demo = await newDemo();
    const { body: seller } = await api(demo.token).post("/erp/sessions/role", { role: "seller" });
    const { body: products } = await api(seller.token).get("/erp/products").expect(200);
    const productId = products.items[0].id;

    const denied = await api(seller.token).patch(`/erp/products/${productId}`, { priceCents: 1 }).expect(403);
    expect(denied.body.error).toBe("forbidden");
    await api(seller.token).post("/erp/stock/movements", { type: "in", productId, quantity: 10, reason: "teste" }).expect(403);
    await api(seller.token).post("/erp/customers", { name: "Cliente do Vendedor", document: "123.456.789-09" }).expect(201);
  });
});

describe("validação e conflitos", () => {
  it("CPF inválido: 400 com a lista de campos", async () => {
    const demo = await newDemo();
    const response = await api(demo.token).post("/erp/customers", { name: "Fulano", document: "111.111.111-11" }).expect(400);
    expect(response.body).toMatchObject({ error: "validation_error", details: { issues: [{ path: "document", message: "CPF ou CNPJ inválido" }] } });
  });

  it("SKU repetido na mesma empresa: 409; em outra empresa, pode", async () => {
    const [a, b] = [await newDemo(), await newDemo()];
    const product = { sku: "TST-001", name: "Produto teste", category: "mercearia", unit: "un", priceCents: 1000, costCents: 600, minStock: 5 };
    await api(a.token).post("/erp/products", product).expect(201);
    const duplicate = await api(a.token).post("/erp/products", product).expect(409);
    expect(duplicate.body).toMatchObject({ error: "conflict", details: { field: "sku" } });
    await api(b.token).post("/erp/products", product).expect(201);
  });

  it("id malformado: 400, não erro interno", async () => {
    const demo = await newDemo();
    const response = await api(demo.token).get("/erp/products/nao-e-um-id").expect(400);
    expect(response.body.error).toBe("validation_error");
  });
});

describe("isolamento entre empresas (multi-tenancy)", () => {
  it("uma empresa não enxerga nem altera dados da outra", async () => {
    const [a, b] = [await newDemo(), await newDemo()];
    const { body } = await api(a.token).get("/erp/products").expect(200);
    const productOfA = body.items[0].id;

    await api(b.token).get(`/erp/products/${productOfA}`).expect(404);
    await api(b.token).patch(`/erp/products/${productOfA}`, { priceCents: 1 }).expect(404);
    const { body: productsOfB } = await api(b.token).get("/erp/products?pageSize=100");
    expect(productsOfB.items.map((product: erp.Product) => product.id)).not.toContain(productOfA);
  });
});

describe("pedidos e estoque", () => {
  async function setup() {
    const demo = await newDemo();
    const client = api(demo.token);
    const { body: customers } = await client.get("/erp/customers");
    const { body: products } = await client.get("/erp/products?pageSize=100");
    const byUnit = (unit: erp.Unit) => (products.items as erp.Product[]).find((product) => product.unit === unit && product.stock >= 4)!;
    return { client, customerId: customers.items[0].id as string, un: byUnit("un"), kg: byUnit("kg") };
  }

  it("rascunho congela preço; confirmar baixa estoque e registra no livro-razão; cancelar devolve", async () => {
    const { client, customerId, un, kg } = await setup();
    const created = await client
      .post("/erp/orders", { customerId, items: [{ productId: un.id, quantity: 2 }, { productId: kg.id, quantity: 1.25 }], discountCents: 100 })
      .expect(201);
    const order: erp.Order = created.body;
    expect(order.status).toBe("draft");
    expect(order.subtotalCents).toBe(un.priceCents * 2 + Math.round(kg.priceCents * 1.25));
    expect(order.totalCents).toBe(order.subtotalCents - 100);

    // Mudar o preço depois não altera o pedido.
    await client.patch(`/erp/products/${un.id}`, { priceCents: un.priceCents + 500 }).expect(200);
    const confirmed = await client.post(`/erp/orders/${order.id}/confirm`).expect(200);
    expect(confirmed.body.items[0].unitPriceCents).toBe(un.priceCents);

    const afterSale = (await client.get(`/erp/products/${kg.id}`)).body as erp.Product;
    expect(afterSale.stock).toBeCloseTo(kg.stock - 1.25, 3);
    const { body: ledger } = await client.get(`/erp/stock/movements?productId=${kg.id}&type=sale`);
    expect(ledger.items[0]).toMatchObject({ type: "sale", delta: -1.25, orderNumber: order.number, balanceAfter: afterSale.stock });

    await client.post(`/erp/orders/${order.id}/confirm`).expect(409);
    await client.post(`/erp/orders/${order.id}/cancel`).expect(200);
    expect(((await client.get(`/erp/products/${kg.id}`)).body as erp.Product).stock).toBeCloseTo(kg.stock, 3);
    await client.patch(`/erp/orders/${order.id}`, { customerId, items: [{ productId: un.id, quantity: 1 }] }).expect(409);
  });

  it("falta de estoque: 409 com todos os itens em falta e nenhum saldo alterado", async () => {
    const { client, customerId, un, kg } = await setup();
    const { body: order } = await client
      .post("/erp/orders", { customerId, items: [{ productId: un.id, quantity: un.stock + 5 }, { productId: kg.id, quantity: 1 }] })
      .expect(201);

    const response = await client.post(`/erp/orders/${order.id}/confirm`).expect(409);
    expect(response.body).toMatchObject({ error: "insufficient_stock", details: [{ productId: un.id, requested: un.stock + 5, available: un.stock }] });
    expect(((await client.get(`/erp/products/${kg.id}`)).body as erp.Product).stock).toBeCloseTo(kg.stock, 3);
    expect(((await client.get(`/erp/orders/${order.id}`)).body as erp.Order).status).toBe("draft");
  });

  it("duas confirmações simultâneas pelo último estoque: só uma passa e o saldo nunca fica negativo", async () => {
    const { client, customerId, un } = await setup();
    await client.post("/erp/stock/movements", { type: "adjust", productId: un.id, quantity: 3, reason: "Contagem para o teste" }).expect(201);

    const orders = await Promise.all(
      [0, 1].map(async () => (await client.post("/erp/orders", { customerId, items: [{ productId: un.id, quantity: 2 }] }).expect(201)).body as erp.Order),
    );
    const results = await Promise.all(orders.map((order) => client.post(`/erp/orders/${order.id}/confirm`)));

    expect(results.map((result) => result.status).sort()).toEqual([200, 409]);
    expect(((await client.get(`/erp/products/${un.id}`)).body as erp.Product).stock).toBe(1);
  });

  it("movimentação manual: saída acima do saldo é recusada; ajuste de inventário vira o novo saldo", async () => {
    const { client, un } = await setup();
    const out = await client.post("/erp/stock/movements", { type: "out", productId: un.id, quantity: un.stock + 1, reason: "Quebra" }).expect(409);
    expect(out.body.error).toBe("insufficient_stock");

    const adjusted = await client.post("/erp/stock/movements", { type: "adjust", productId: un.id, quantity: 7, reason: "Inventário mensal" }).expect(201);
    expect(adjusted.body).toMatchObject({ type: "adjust", delta: 7 - un.stock, balanceAfter: 7 });
  });

  it("item vendido por unidade não aceita fração", async () => {
    const { client, customerId, un } = await setup();
    const response = await client.post("/erp/orders", { customerId, items: [{ productId: un.id, quantity: 1.5 }] }).expect(400);
    expect(response.body.message).toContain("unidade");
  });
});

describe("dashboard", () => {
  it("6 meses de faturamento, estoque baixo e contagem por status coerentes com os pedidos", async () => {
    const demo = await newDemo();
    const { body }: { body: erp.Dashboard } = await api(demo.token).get("/erp/dashboard").expect(200);
    expect(body.revenueByMonth).toHaveLength(6);
    expect(body.revenueByMonth.some((month) => month.totalCents > 0)).toBe(true);
    expect(body.lowStock.length).toBeGreaterThan(0);
    expect(body.topProducts.length).toBe(5);
    expect(body.totals).toEqual({ products: 40, customers: 12 });

    const { body: confirmed } = await api(demo.token).get("/erp/orders?status=confirmed&pageSize=1");
    expect(body.ordersByStatus.confirmed).toBe(confirmed.total);
  });
});

describe("proteções", () => {
  it("documentação OpenAPI publicada com as rotas do ERP", async () => {
    const { body } = await request(app.getHttpServer()).get("/docs-json").expect(200);
    expect(Object.keys(body.paths)).toEqual(expect.arrayContaining(["/erp/sessions/demo", "/erp/orders/{id}/confirm", "/erp/dashboard"]));

    // A interface vem do CDN: na Vercel, os arquivos do node_modules não chegam à função.
    const page = await request(app.getHttpServer()).get("/docs").expect(200);
    expect(page.text).toContain("https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js");
    expect(page.text).toContain("https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css");
  });

  it("limite de demos ativas: 503 demo_full", async () => {
    const connection = app.get<Connection>(getConnectionToken());
    const expiresAt = new Date(Date.now() + 3_600_000);
    const active = await connection.collection("erp_workspaces").countDocuments({ expiresAt: { $gt: new Date() } });
    await connection.collection("erp_workspaces").insertMany(Array.from({ length: 50 - active }, (_, index) => ({ name: `Lotada ${index}`, expiresAt })));

    const response = await request(app.getHttpServer()).post("/erp/sessions/demo").set("x-bff-key", "test-bff-key").set("x-client-ip", "10.9.9.9").expect(503);
    expect(response.body.error).toBe("demo_full");
    await connection.collection("erp_workspaces").deleteMany({ name: /^Lotada / });
  });

  it("rate limit por visitante: a 6ª demo do mesmo IP em 1h é recusada", async () => {
    const create = () => request(app.getHttpServer()).post("/erp/sessions/demo").set("x-bff-key", "test-bff-key").set("x-client-ip", "10.1.1.1");
    for (let index = 0; index < 5; index++) await create().expect(201);
    const response = await create().expect(429);
    expect(response.body.error).toBe("rate_limited");
    // Chave errada: o IP informado é ignorado (não dá para burlar trocando o cabeçalho).
    await request(app.getHttpServer()).post("/erp/sessions/demo").set("x-bff-key", "errada").set("x-client-ip", "10.2.2.2").expect(201);
  });
});

describe("PDV (frente de caixa)", () => {
  const key = () => `venda-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
  const sell = (token: string, body: object, idempotencyKey?: string) => {
    const call = request(app.getHttpServer()).post("/erp/pos/sales").set("Authorization", `Bearer ${token}`);
    return (idempotencyKey ? call.set("Idempotency-Key", idempotencyKey) : call).send(body);
  };
  const packaged = async (token: string) => {
    const { body } = await api(token).get("/erp/products?pageSize=100").expect(200);
    return (body.items as erp.Product[]).find((product) => product.unit === "un" && product.stock >= 5)!;
  };

  it("venda sem cliente, em dinheiro: nasce confirmada, calcula o troco e baixa o estoque", async () => {
    const demo = await newDemo();
    const product = await packaged(demo.token);
    const total = product.priceCents * 2;
    const paid = Math.ceil(total / 1000) * 1000 + 1000;

    const { body: sale } = await sell(demo.token, { items: [{ productId: product.id, quantity: 2 }], payments: [{ method: "cash", amountCents: paid }] }, key()).expect(201);
    expect(sale).toMatchObject({ channel: "pos", status: "confirmed", customer: null, totalCents: total, changeCents: paid - total, payments: [{ method: "cash", amountCents: paid }] });

    const { body: after } = await api(demo.token).get(`/erp/products/${product.id}`).expect(200);
    expect(after.stock).toBe(product.stock - 2);
    const { body: ledger } = await api(demo.token).get(`/erp/stock/movements?productId=${product.id}`).expect(200);
    expect(ledger.items[0]).toMatchObject({ type: "sale", delta: -2, reason: `Venda no PDV — #${sale.number}` });
  });

  it("idempotência: repetir a mesma venda devolve a mesma (200) e não baixa o estoque de novo", async () => {
    const demo = await newDemo();
    const product = await packaged(demo.token);
    const body = { items: [{ productId: product.id, quantity: 1 }], payments: [{ method: "pix", amountCents: product.priceCents }] };
    const sameKey = key();

    const first = await sell(demo.token, body, sameKey).expect(201);
    const retry = await sell(demo.token, body, sameKey).expect(200);
    expect(retry.headers["idempotent-replayed"]).toBe("true");
    expect(retry.body.id).toBe(first.body.id);

    const other = await sell(demo.token, { ...body, items: [{ productId: product.id, quantity: 2 }] }, sameKey).expect(409);
    expect(other.body.error).toBe("conflict");

    const { body: after } = await api(demo.token).get(`/erp/products/${product.id}`).expect(200);
    expect(after.stock).toBe(product.stock - 1);
  });

  it("mesma chave ao mesmo tempo (clique duplo): uma venda só", async () => {
    const demo = await newDemo();
    const product = await packaged(demo.token);
    const body = { items: [{ productId: product.id, quantity: 1 }], payments: [{ method: "debit", amountCents: product.priceCents }] };
    const sameKey = key();

    const responses = await Promise.all([1, 2, 3].map(() => sell(demo.token, body, sameKey)));
    expect(responses.map((response) => response.status).sort()).toEqual([200, 200, 201]);
    expect(new Set(responses.map((response) => response.body.id)).size).toBe(1);

    const { body: after } = await api(demo.token).get(`/erp/products/${product.id}`).expect(200);
    expect(after.stock).toBe(product.stock - 1);
  });

  it("pagamento: falta dinheiro, cartão acima do total e chave ausente são recusados", async () => {
    const demo = await newDemo();
    const product = await packaged(demo.token);
    const items = [{ productId: product.id, quantity: 1 }];

    const short = await sell(demo.token, { items, payments: [{ method: "pix", amountCents: product.priceCents - 1 }] }, key()).expect(400);
    expect(short.body.message).toMatch(/Pagamento insuficiente/);
    const overCard = await sell(demo.token, { items, payments: [{ method: "credit", amountCents: product.priceCents + 100 }] }, key()).expect(400);
    expect(overCard.body.message).toMatch(/Cartão e Pix/);
    await sell(demo.token, { items, payments: [{ method: "pix", amountCents: product.priceCents }] }).expect(400);

    // Pagamento dividido: Pix + dinheiro com troco.
    const split = await sell(demo.token, { items, payments: [{ method: "pix", amountCents: 100 }, { method: "cash", amountCents: product.priceCents }] }, key()).expect(201);
    expect(split.body.changeCents).toBe(100);
  });

  it("vendedor também vende; cancelar a venda devolve o estoque", async () => {
    const demo = await newDemo();
    const { body: seller } = await api(demo.token).post("/erp/sessions/role", { role: "seller" });
    const product = await packaged(seller.token);
    const { body: sale } = await sell(seller.token, { items: [{ productId: product.id, quantity: 3 }], payments: [{ method: "credit", amountCents: product.priceCents * 3 }] }, key()).expect(201);
    expect(sale.createdByRole).toBe("seller");

    await api(demo.token).post(`/erp/orders/${sale.id}/cancel`).expect(200);
    const { body: after } = await api(demo.token).get(`/erp/products/${product.id}`).expect(200);
    expect(after.stock).toBe(product.stock);
  });

  it("código de barras: busca pelo EAN, EAN inválido, PLU só para kg e duplicado na empresa", async () => {
    const demo = await newDemo();
    const product = await packaged(demo.token);
    const found = await api(demo.token).get(`/erp/products?search=${product.barcode}`).expect(200);
    expect(found.body.items.map((item: erp.Product) => item.id)).toEqual([product.id]);

    const base = { sku: "EAN-001", name: "Produto com EAN", category: "mercearia", unit: "un", priceCents: 1000, costCents: 500, minStock: 1 };
    const badDigit = await api(demo.token).post("/erp/products", { ...base, barcode: "7891234567890" }).expect(400);
    expect(badDigit.body.details.issues[0]).toMatchObject({ path: "barcode" });
    await api(demo.token).post("/erp/products", { ...base, barcode: "00123" }).expect(400);
    await api(demo.token).post("/erp/products", { ...base, unit: "kg", barcode: "7891234567895" }).expect(400);
    const duplicate = await api(demo.token).post("/erp/products", { ...base, barcode: product.barcode }).expect(409);
    expect(duplicate.body.details.field).toBe("barcode");

    // Edição só da unidade: confere com o código salvo.
    await api(demo.token).patch(`/erp/products/${product.id}`, { unit: "kg" }).expect(400);
  });
});

describe("contas por convite", () => {
  const PASSWORD = "senha-forte-do-dono";
  let owner: erp.AccountSession;

  /** Rotas públicas de conta como se viessem do BFF, cada uma de um "visitante" (o rate limit é por IP). */
  const pub = () => {
    const ip = `10.9.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
    const server = app.getHttpServer();
    return {
      get: (path: string) => request(server).get(path).set("x-bff-key", "test-bff-key").set("x-client-ip", ip),
      post: (path: string, body: object) => request(server).post(path).set("x-bff-key", "test-bff-key").set("x-client-ip", ip).send(body),
    };
  };
  const login = (email: string, password: string) => pub().post("/erp/auth/login", { email, password });

  /** Convida e aceita: devolve a sessão da pessoa nova. */
  async function invited(inviter: string, email: string, role: erp.Role, path = "/erp/team/invites", workspaceId?: string): Promise<erp.AccountSession> {
    const { body: link } = await api(inviter).post(path, { email, role, ...(workspaceId ? { workspaceId } : {}) }).expect(201);
    const { body } = await pub().post(`/erp/auth/invites/${link.token}/accept`, { name: `Pessoa ${email}`, password: "senha-da-pessoa-1" }).expect(201);
    return body;
  }

  beforeAll(async () => {
    expect((await pub().get("/erp/auth/setup").expect(200)).body).toEqual({ available: true });
    await pub()
      .post("/erp/auth/setup", { token: "token-errado-mas-longo", name: "Dono", email: "dono@exemplo.com.br", password: PASSWORD, companyName: "Mercado do Dono" })
      .expect(403);
    const { body } = await pub()
      .post("/erp/auth/setup", { token: "token-de-instalacao-do-teste", name: "Dono", email: "Dono@Exemplo.com.br", password: PASSWORD, companyName: "Mercado do Dono" })
      .expect(201);
    owner = body;
  });

  it("instalação cria o dono uma vez só; a empresa de verdade não expira", async () => {
    expect(owner).toMatchObject({ kind: "account", role: "admin", user: { email: "dono@exemplo.com.br", isOwner: true }, workspace: { name: "Mercado do Dono" } });
    await pub()
      .post("/erp/auth/setup", { token: "token-de-instalacao-do-teste", name: "Outro", email: "outro@exemplo.com.br", password: PASSWORD, companyName: "Outro" })
      .expect(409);
    expect((await pub().get("/erp/auth/setup").expect(200)).body).toEqual({ available: false });

    const me = await api(owner.token).get("/erp/me").expect(200);
    expect(me.body.workspace.expiresAt).toBeUndefined();
    const product = { sku: "REAL-1", name: "Produto real", category: "mercearia", unit: "un", priceCents: 500, costCents: 300, minStock: 1 };
    const { body: created } = await api(owner.token).post("/erp/products", product).expect(201);
    const stored = await app.get<Connection>(getConnectionToken()).collection("erp_products").findOne({ sku: "REAL-1" });
    expect(stored?.expiresAt).toBeUndefined();
    expect(created.stock).toBe(0);
    await api(owner.token).post("/erp/sessions/role", { role: "seller" }).expect(403);
  });

  it("login: mensagem genérica para e-mail ou senha errados", async () => {
    const ok = await login("dono@exemplo.com.br", PASSWORD).expect(200);
    expect(ok.body.user.isOwner).toBe(true);
    const wrong = await login("dono@exemplo.com.br", "senha-errada-123").expect(401);
    const unknown = await login("ninguem@exemplo.com.br", "senha-errada-123").expect(401);
    expect(wrong.body.message).toBe("E-mail ou senha inválidos");
    expect(unknown.body.message).toBe(wrong.body.message);
  });

  it("convite: link de uso único, papel definido por quem convidou, empresa isolada", async () => {
    const { body: link } = await api(owner.token).post("/erp/team/invites", { email: "vendedora@exemplo.com.br", role: "seller" }).expect(201);
    expect(link.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const preview = await pub().get(`/erp/auth/invites/${link.token}`).expect(200);
    expect(preview.body).toMatchObject({ email: "vendedora@exemplo.com.br", role: "seller", workspace: { name: "Mercado do Dono" } });

    await pub().post(`/erp/auth/invites/${link.token}/accept`, { name: "Vendedora", password: "curta" }).expect(400);
    const { body: seller } = await pub().post(`/erp/auth/invites/${link.token}/accept`, { name: "Vendedora", password: "senha-da-vendedora" }).expect(201);
    expect(seller).toMatchObject({ kind: "account", role: "seller", workspace: { id: owner.workspace.id } });
    await pub().post(`/erp/auth/invites/${link.token}/accept`, { name: "De novo", password: "senha-da-vendedora" }).expect(404);
    await pub().get("/erp/auth/invites/token-invalido").expect(400);

    // Mesma empresa do dono: vê o produto dele. Vendedor não gerencia equipe; demo não tem equipe.
    const { body: products } = await api(seller.token).get("/erp/products").expect(200);
    expect(products.items.map((item: erp.Product) => item.sku)).toContain("REAL-1");
    await api(seller.token).get("/erp/team").expect(403);
    await api((await newDemo()).token).get("/erp/team").expect(403);
    await api(owner.token).post("/erp/team/invites", { email: "vendedora@exemplo.com.br", role: "seller" }).expect(409);
  });

  it("bloquear derruba a sessão na hora; promover vale na hora", async () => {
    const person = await invited(owner.token, "bloqueio@exemplo.com.br", "seller");
    await api(person.token).get("/erp/products").expect(200);

    await api(owner.token).patch(`/erp/team/members/${person.user.id}`, { status: "blocked" }).expect(200);
    await api(person.token).get("/erp/products").expect(401);
    const blocked = await login("bloqueio@exemplo.com.br", "senha-da-pessoa-1").expect(403);
    expect(blocked.body.message).toMatch(/bloqueado/);

    await api(owner.token).patch(`/erp/team/members/${person.user.id}`, { status: "active", role: "admin" }).expect(200);
    const { body: again } = await login("bloqueio@exemplo.com.br", "senha-da-pessoa-1").expect(200);
    await api(again.token).get("/erp/team").expect(200);

    // Ninguém mexe em si mesmo pela equipe, e admin não mexe no dono.
    await api(owner.token).patch(`/erp/team/members/${owner.user.id}`, { role: "seller" }).expect(409);
    await api(again.token).patch(`/erp/team/members/${owner.user.id}`, { status: "blocked" }).expect(403);
  });

  it("5 senhas erradas seguidas bloqueiam o login por um tempo", async () => {
    await invited(owner.token, "tentativas@exemplo.com.br", "seller");
    for (let attempt = 0; attempt < 5; attempt++) await login("tentativas@exemplo.com.br", "senha-errada-123").expect(401);
    const locked = await login("tentativas@exemplo.com.br", "senha-da-pessoa-1").expect(429);
    expect(locked.body.error).toBe("rate_limited");
  });

  it("link de senha: gerado pelo admin, uso único, derruba as sessões antigas", async () => {
    const person = await invited(owner.token, "esqueceu@exemplo.com.br", "seller");
    const { body: link } = await api(owner.token).post(`/erp/team/members/${person.user.id}/reset`).expect(201);
    expect((await pub().get(`/erp/auth/resets/${link.token}`).expect(200)).body).toMatchObject({ email: "esqueceu@exemplo.com.br" });

    const { body: fresh } = await pub().post(`/erp/auth/resets/${link.token}`, { password: "senha-nova-lembrada" }).expect(201);
    await api(person.token).get("/erp/products").expect(401);
    await api(fresh.token).get("/erp/products").expect(200);
    await pub().post(`/erp/auth/resets/${link.token}`, { password: "outra-senha-nova" }).expect(404);
    await login("esqueceu@exemplo.com.br", "senha-nova-lembrada").expect(200);
  });

  it("trocar a própria senha exige a atual e invalida o token antigo", async () => {
    const person = await invited(owner.token, "troca@exemplo.com.br", "seller");
    await api(person.token).post("/erp/auth/password", { current: "errada", next: "senha-nova-da-troca" }).expect(400);
    const { body: renewed } = await api(person.token).post("/erp/auth/password", { current: "senha-da-pessoa-1", next: "senha-nova-da-troca" }).expect(200);
    await api(person.token).get("/erp/products").expect(401);
    await api(renewed.token).get("/erp/products").expect(200);
  });

  it("painel do dono: empresas, convite para outra empresa e isolamento entre elas", async () => {
    const { body: company } = await api(owner.token).post("/erp/owner/companies", { name: "Mercearia da Ana" }).expect(201);
    const ana = await invited(owner.token, "ana@exemplo.com.br", "admin", "/erp/owner/invites", company.id);
    expect(ana.workspace).toEqual({ id: company.id, name: "Mercearia da Ana" });

    // A Ana administra só a empresa dela.
    const { body: team } = await api(ana.token).get("/erp/team").expect(200);
    expect(team.members.map((member: erp.TeamMember) => member.email)).toEqual(["ana@exemplo.com.br"]);
    const { body: products } = await api(ana.token).get("/erp/products").expect(200);
    expect(products.total).toBe(0);
    const { body: users } = await api(owner.token).get("/erp/owner/users").expect(200);
    const seller = users.find((user: erp.TeamMember) => user.email === "vendedora@exemplo.com.br");
    await api(ana.token).patch(`/erp/team/members/${seller.id}`, { status: "blocked" }).expect(404);
    await api(ana.token).get("/erp/owner/overview").expect(403);

    const { body: overview } = await api(owner.token).get("/erp/owner/overview").expect(200);
    expect(overview).toMatchObject({ companies: 2, blockedUsers: 0 });
    expect(overview.users).toBeGreaterThanOrEqual(6);
    expect(overview.activeDemos).toBeGreaterThan(0);
    const { body: companies } = await api(owner.token).get("/erp/owner/companies").expect(200);
    expect(companies.map((item: erp.Company) => item.name)).toEqual(["Mercado do Dono", "Mercearia da Ana"]);
    expect(companies[0].products).toBe(1);
  });
});

describe("pedidos de acesso", () => {
  const visitor = () => {
    const ip = `10.8.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
    return (path: string, body: object) => request(app.getHttpServer()).post(path).set("x-bff-key", "test-bff-key").set("x-client-ip", ip).send(body);
  };
  let owner: erp.AccountSession;

  beforeAll(async () => {
    const { body } = await visitor()("/erp/auth/login", { email: "dono@exemplo.com.br", password: "senha-forte-do-dono" }).expect(200);
    owner = body;
  });

  it("pedido público chega ao painel; repetido, de conta existente ou de robô não duplica", async () => {
    const ask = { name: "Carlos Pereira", email: "carlos@exemplo.com.br", company: "Empório do Carlos", message: "Quero testar no meu mercado" };
    expect((await visitor()("/erp/auth/access-requests", ask).expect(202)).body).toEqual({ received: true });
    await visitor()("/erp/auth/access-requests", ask).expect(202);
    await visitor()("/erp/auth/access-requests", { name: "Dono", email: "dono@exemplo.com.br" }).expect(202);
    await visitor()("/erp/auth/access-requests", { name: "Robô", email: "robo@exemplo.com.br", website: "http://spam" }).expect(202);
    await visitor()("/erp/auth/access-requests", { name: "X", email: "invalido" }).expect(400);

    const { body: pending } = await api(owner.token).get("/erp/owner/access-requests").expect(200);
    expect(pending.map((item: erp.AccessRequest) => item.email)).toEqual(["carlos@exemplo.com.br"]);
    expect(pending[0]).toMatchObject({ company: "Empório do Carlos", message: "Quero testar no meu mercado", status: "pending" });
    expect((await api(owner.token).get("/erp/owner/overview").expect(200)).body.pendingRequests).toBe(1);
  });

  it("aprovar criando empresa nova: vira convite de administrador; recusar tira da lista", async () => {
    const [carlos] = (await api(owner.token).get("/erp/owner/access-requests").expect(200)).body as erp.AccessRequest[];
    await api(owner.token).post(`/erp/owner/access-requests/${carlos!.id}/approve`, { role: "seller" }).expect(400);
    const { body: link } = await api(owner.token).post(`/erp/owner/access-requests/${carlos!.id}/approve`, { role: "seller", companyName: "Empório do Carlos" }).expect(201);

    const { body: session } = await visitor()(`/erp/auth/invites/${link.token}/accept`, { name: "Carlos Pereira", password: "senha-do-carlos" }).expect(201);
    expect(session).toMatchObject({ role: "admin", workspace: { name: "Empório do Carlos" } });
    await api(owner.token).post(`/erp/owner/access-requests/${carlos!.id}/approve`, { role: "seller", companyName: "Outra" }).expect(404);

    await visitor()("/erp/auth/access-requests", { name: "Maria", email: "maria@exemplo.com.br" }).expect(202);
    const [maria] = (await api(owner.token).get("/erp/owner/access-requests").expect(200)).body as erp.AccessRequest[];
    await api(session.token).post(`/erp/owner/access-requests/${maria!.id}/reject`).expect(403);
    await api(owner.token).post(`/erp/owner/access-requests/${maria!.id}/reject`).expect(204);
    expect((await api(owner.token).get("/erp/owner/access-requests").expect(200)).body).toEqual([]);
  });
});

describe("segurança", () => {
  const visitor = () => {
    const ip = `10.7.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
    const server = app.getHttpServer();
    return {
      post: (path: string, body: unknown) => request(server).post(path).set("x-bff-key", "test-bff-key").set("x-client-ip", ip).send(body as object),
      get: (path: string) => request(server).get(path).set("x-bff-key", "test-bff-key").set("x-client-ip", ip),
    };
  };

  it("injeção NoSQL no login não passa: operador no lugar de texto é 400", async () => {
    for (const body of [
      { email: { $ne: null }, password: { $ne: null } },
      { email: "dono@exemplo.com.br", password: { $gt: "" } },
      { email: { $regex: ".*" }, password: "qualquer-coisa" },
    ]) {
      const response = await visitor().post("/erp/auth/login", body).expect(400);
      expect(response.body.error).toBe("validation_error");
    }
  });

  it("injeção NoSQL na query e nos ids também é 400", async () => {
    const demo = await newDemo();
    // A query do Express 5 não vira objeto: "search[$ne]" é só uma chave desconhecida, descartada.
    const { body: all } = await api(demo.token).get("/erp/products").expect(200);
    const { body: injected } = await api(demo.token).get("/erp/products?search[$ne]=x").expect(200);
    expect(injected.total).toBe(all.total);
    await api(demo.token).get("/erp/customers?search[$regex]=.*").expect(200);
    const { body: orders } = await api(demo.token).get("/erp/orders?customerId[$ne]=000000000000000000000000").expect(200);
    expect(orders.total).toBe((await api(demo.token).get("/erp/orders").expect(200)).body.total);
    // Operador no lugar do próprio valor: o texto não é id válido.
    await api(demo.token).get("/erp/orders?customerId=%7B%22$ne%22:null%7D").expect(400);
    await api(demo.token).get("/erp/products/%7B%22$ne%22:null%7D").expect(400);
    await visitor().get("/erp/auth/invites/%7B%24ne%3Anull%7D").expect(400);
  });

  it("busca com caracteres de regex é tratada como texto (sem ReDoS nem vazamento)", async () => {
    const demo = await newDemo();
    const { body } = await api(demo.token).get(`/erp/products?search=${encodeURIComponent(".*")}`).expect(200);
    expect(body.total).toBe(0);
    await api(demo.token).get(`/erp/products?search=${encodeURIComponent("(a+)+$")}`).expect(200);
  });

  it("campos extras no corpo são descartados (sem mass assignment)", async () => {
    const demo = await newDemo();
    const { body } = await api(demo.token)
      .post("/erp/products", { sku: "SEC-1", name: "Produto", category: "mercearia", unit: "un", priceCents: 100, costCents: 50, minStock: 1, stock: 999, workspaceId: "000000000000000000000000", active: false })
      .expect(201);
    expect(body).toMatchObject({ stock: 0, active: true });
    const { body: products } = await api(demo.token).get("/erp/products?search=SEC-1").expect(200);
    expect(products.total).toBe(1);
  });

  it("token forjado (outro algoritmo, sem assinatura ou outro segredo) é 401", async () => {
    const demo = await newDemo();
    const [, payload] = demo.token.split(".");
    const unsigned = `${Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url")}.${payload}.`;
    await api(unsigned).get("/erp/products").expect(401);
    const jwt = app.get(JwtService);
    const otherSecret = await jwt.signAsync({ sub: demo.workspace.id, role: "admin" }, { secret: "outro-segredo-qualquer-de-32-caracteres!!" });
    await api(otherSecret).get("/erp/products").expect(401);
    const hs512 = await jwt.signAsync({ sub: demo.workspace.id, role: "admin" }, { algorithm: "HS512" });
    await api(hs512).get("/erp/products").expect(401);
  });

  it("cabeçalhos de segurança em todas as respostas", async () => {
    const response = await request(app.getHttpServer()).get("/health");
    expect(response.headers["x-powered-by"]).toBeUndefined();
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBe("SAMEORIGIN");
    expect(response.headers["strict-transport-security"]).toMatch(/max-age=/);
    expect(response.headers["content-security-policy"]).toContain("frame-ancestors 'none'");
  });
});
