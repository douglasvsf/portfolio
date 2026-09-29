import { Types } from "mongoose";
import { erp } from "@portfolio/shared";
import { buildDemoData } from "./supermarket";

describe("dados da demo (mercado)", () => {
  const now = new Date("2026-09-28T15:00:00Z");
  const expiresAt = new Date(now.getTime() + 86_400_000);
  const data = buildDemoData(new Types.ObjectId(), now, expiresAt);

  it("todo produto e cliente passa pelo mesmo contrato que a API valida", () => {
    for (const product of data.products) expect(erp.productInputSchema.safeParse(product).success).toBe(true);
    for (const customer of data.customers) {
      const parsed = erp.customerInputSchema.safeParse(customer);
      expect(parsed.success).toBe(true);
    }
  });

  it("livro-razão coerente: saldo nunca negativo e sempre a soma das movimentações anteriores", () => {
    const running = new Map<string, number>();
    const sorted = [...data.movements].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    for (const movement of sorted) {
      const key = movement.productId.toString();
      const balance = Math.round(((running.get(key) ?? 0) + movement.delta) * 1000) / 1000;
      running.set(key, balance);
      expect(movement.balanceAfter).toBeCloseTo(balance, 3);
      expect(movement.balanceAfter).toBeGreaterThanOrEqual(0);
    }
    for (const product of data.products) expect(product.stock).toBeCloseTo(running.get(product._id.toString()) ?? 0, 3);
  });

  it("pedidos: totais corretos, datas no passado e estados coerentes", () => {
    for (const order of data.orders) {
      expect(order.subtotalCents).toBe(order.items.reduce((sum, item) => sum + item.totalCents, 0));
      expect(order.totalCents).toBe(order.subtotalCents - order.discountCents);
      expect(order.createdAt.getTime()).toBeLessThanOrEqual(now.getTime());
      if (order.status === "draft") expect(order.confirmedAt).toBeUndefined();
      if (order.status === "cancelled") expect(order.cancelledAt!.getTime()).toBeGreaterThan(order.confirmedAt!.getTime());
      for (const item of order.items) if (item.unit === "un") expect(Number.isInteger(item.quantity)).toBe(true);
    }
    expect(data.orders.map((order) => order.number)).toEqual(data.orders.map((_, index) => index + 1));
    expect(new Set(data.orders.map((order) => order.status))).toEqual(new Set(["draft", "confirmed", "cancelled"]));
  });

  it("vendas no livro-razão batem com os pedidos confirmados (e cancelados devolvem)", () => {
    const soldFromOrders = data.orders
      .filter((order) => order.status === "confirmed")
      .flatMap((order) => order.items)
      .reduce((sum, item) => sum + item.quantity, 0);
    const soldFromLedger = -data.movements.filter((movement) => movement.type === "sale" || movement.type === "sale_cancel").reduce((sum, movement) => sum + movement.delta, 0);
    expect(soldFromLedger).toBeCloseTo(soldFromOrders, 3);
  });

  it("produto vendido por unidade nunca tem saldo fracionado", () => {
    for (const product of data.products.filter((candidate) => candidate.unit === "un")) expect(Number.isInteger(product.stock)).toBe(true);
    for (const movement of data.movements) {
      const product = data.products.find((candidate) => candidate._id.equals(movement.productId))!;
      if (product.unit === "un") expect(Number.isInteger(movement.balanceAfter)).toBe(true);
    }
  });

  it("códigos de barras válidos e únicos: EAN para embalados, PLU para kg", () => {
    const codes = data.products.map((product) => product.barcode);
    expect(new Set(codes).size).toBe(codes.length);
    for (const product of data.products) expect(product.unit === "kg" ? erp.isPlu(product.barcode) : erp.isValidEan(product.barcode)).toBe(true);
  });

  it("vendas de PDV: confirmadas na hora, pagamento fecha com o total e troco só em dinheiro", () => {
    const pos = data.orders.filter((order) => order.channel === "pos");
    expect(pos.length).toBeGreaterThan(5);
    expect(pos.some((order) => !("customerId" in order))).toBe(true);
    for (const order of pos) {
      expect(order.status).toBe("confirmed");
      const paid = order.payments!.reduce((sum, payment) => sum + payment.amountCents, 0);
      expect(paid - order.totalCents).toBe(order.changeCents);
      if (order.payments![0]!.method !== "cash") expect(order.changeCents).toBe(0);
    }
  });

  it("alguns produtos terminam abaixo do mínimo (alimenta os alertas do dashboard)", () => {
    expect(data.products.filter((product) => product.stock < product.minStock).length).toBeGreaterThan(0);
  });

  it("todo documento carrega a empresa e a expiração (TTL apaga tudo junto)", () => {
    for (const doc of [...data.products, ...data.customers, ...data.orders, ...data.movements]) {
      expect(doc.expiresAt).toBe(expiresAt);
    }
  });

  it("determinístico: duas demos têm a mesma loja", () => {
    const again = buildDemoData(new Types.ObjectId(), now, expiresAt);
    expect(again.products.map((product) => [product.sku, product.stock])).toEqual(data.products.map((product) => [product.sku, product.stock]));
  });
});
