import { erp } from "@portfolio/shared";
import { addToCart, barcodeIndex, cartTotals, newSaleKey, paymentSummary, resolveScan } from "./pos";

const product = (id: string, name: string, unit: erp.Unit, priceCents: number, barcode?: string, stock = 50): erp.Product => ({
  id,
  sku: `SKU-${id}`,
  name,
  category: "mercearia",
  unit,
  priceCents,
  costCents: 1,
  minStock: 1,
  stock,
  active: true,
  createdAt: "",
  updatedAt: "",
  ...(barcode ? { barcode } : {}),
});

const arroz = product("a", "Arroz branco 5 kg", "un", 2890, "7891234567895");
const feijao = product("f", "Feijão carioca", "un", 849, "96385074");
const banana = product("b", "Banana prata", "kg", 699, "00101", 30);
const products = [arroz, feijao, banana];

describe("PDV — leitura do código", () => {
  it("EAN, multiplicador e etiqueta da balança", () => {
    expect(resolveScan("7891234567895", products)).toEqual({ type: "add", product: arroz, quantity: 1 });
    expect(resolveScan("3*96385074", products)).toEqual({ type: "add", product: feijao, quantity: 3 });
    expect(resolveScan(erp.buildScaleLabel("00101", 1250), products)).toEqual({ type: "add", product: banana, quantity: 1.25 });
  });

  it("busca por nome sem acento; várias opções viram escolha", () => {
    expect(resolveScan("feijao", products)).toMatchObject({ type: "add", product: feijao });
    expect(resolveScan("2*a", products)).toMatchObject({ type: "choose", multiplier: 2 });
    expect(resolveScan("sku-b", products)).toMatchObject({ type: "add", product: banana });
  });

  it("erros claros e entrada vazia", () => {
    expect(resolveScan("7890000000017", products)).toEqual({ type: "error", message: "Código 7890000000017 não encontrado" });
    expect(resolveScan(erp.buildScaleLabel("09999", 500), products)).toMatchObject({ type: "error", message: expect.stringMatching(/PLU 09999/) });
    expect(resolveScan(erp.buildScaleLabel("00101", 0), products)).toMatchObject({ type: "error", message: "Etiqueta de balança sem peso" });
    expect(resolveScan("xyz", products)).toMatchObject({ type: "error" });
    expect(resolveScan("  ", products)).toBeNull();
    expect(barcodeIndex([arroz, product("x", "Sem código", "un", 1)]).size).toBe(1);
  });
});

describe("PDV — carrinho e pagamentos", () => {
  it("bipar de novo soma; unidade arredonda para inteiro", () => {
    let lines = addToCart([], arroz, 1);
    lines = addToCart(lines, arroz, 2);
    lines = addToCart(lines, banana, 0.4);
    lines = addToCart(lines, banana, 0.35);
    lines = addToCart(lines, feijao, 1.6);
    expect(lines).toEqual([
      { productId: "a", quantity: 3 },
      { productId: "b", quantity: 0.75 },
      { productId: "f", quantity: 2 },
    ]);
  });

  it("totais com desconto limitado ao subtotal e aviso de estoque", () => {
    const byId = new Map(products.map((item) => [item.id, item]));
    const totals = cartTotals([{ productId: "a", quantity: 2 }, { productId: "b", quantity: 40 }], byId, 780);
    expect(totals).toMatchObject({ subtotalCents: 5780 + 27960, discountCents: 780, totalCents: 5000 + 27960 });
    expect(totals.rows.map((row) => row.overStock)).toEqual([false, true]);
    expect(cartTotals([{ productId: "f", quantity: 1 }], byId, 99999).totalCents).toBe(0);
  });

  it("troco só em dinheiro; cartão acima do total é erro", () => {
    expect(paymentSummary([{ method: "cash", amountCents: 5000 }], 4210)).toMatchObject({ changeCents: 790, remainingCents: 0, complete: true });
    expect(paymentSummary([{ method: "pix", amountCents: 1000 }], 4210)).toMatchObject({ remainingCents: 3210, complete: false });
    expect(paymentSummary([{ method: "credit", amountCents: 5000 }], 4210)).toMatchObject({ complete: false, error: expect.stringMatching(/Cartão e Pix/) });
    expect(paymentSummary([], 0).complete).toBe(false);
  });

  it("chave de idempotência nova a cada venda e aceita pela API", () => {
    const [a, b] = [newSaleKey(), newSaleKey()];
    expect(a).not.toBe(b);
    expect(erp.idempotencyKeySchema.safeParse(a).success).toBe(true);
  });
});
