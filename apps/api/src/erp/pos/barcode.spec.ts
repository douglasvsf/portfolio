import { erp } from "@portfolio/shared";
import { fingerprint, settlePayments } from "./pos.service";

describe("código de barras (contrato compartilhado)", () => {
  it("EAN-13 e EAN-8: dígito verificador", () => {
    expect(erp.isValidEan("7891234567895")).toBe(true);
    expect(erp.isValidEan("7891234567890")).toBe(false);
    expect(erp.isValidEan("96385074")).toBe(true);
    expect(erp.isValidEan("123")).toBe(false);
    expect(erp.completeEan("789123456789")).toBe("7891234567895");
  });

  it("etiqueta da balança: 2 + PLU + gramas + DV, e o PDV lê de volta", () => {
    const label = erp.buildScaleLabel("00101", 1250);
    expect(label).toMatch(/^200101001250\d$/);
    expect(erp.isValidEan(label)).toBe(true);
    expect(erp.parseScanInput(label)).toEqual({ kind: "scale", plu: "00101", grams: 1250, multiplier: 1 });
  });

  it("multiplicador do caixa, PLU digitado e busca por nome", () => {
    expect(erp.parseScanInput("3*7891234567895")).toEqual({ kind: "ean", code: "7891234567895", multiplier: 3 });
    expect(erp.parseScanInput("2 x 7891234567895")).toEqual({ kind: "ean", code: "7891234567895", multiplier: 2 });
    expect(erp.parseScanInput("00101")).toEqual({ kind: "ean", code: "00101", multiplier: 1 });
    expect(erp.parseScanInput("2*arroz")).toEqual({ kind: "text", text: "arroz", multiplier: 2 });
    expect(erp.parseScanInput("7891234567890")).toEqual({ kind: "text", text: "7891234567890", multiplier: 1 });
    expect(erp.parseScanInput("   ")).toBeNull();
  });

  it("produto: PLU só em kg, EAN fora da faixa 2 da balança", () => {
    const base = { sku: "TST-1", name: "Teste", category: "mercearia", unit: "un", priceCents: 100, costCents: 50, minStock: 1 } as const;
    expect(erp.productInputSchema.safeParse({ ...base, barcode: "7891234567895" }).success).toBe(true);
    expect(erp.productInputSchema.safeParse({ ...base }).success).toBe(true);
    expect(erp.productInputSchema.safeParse({ ...base, unit: "kg", barcode: "00101" }).success).toBe(true);
    expect(erp.productInputSchema.safeParse({ ...base, barcode: "00101" }).success).toBe(false);
    expect(erp.productInputSchema.safeParse({ ...base, unit: "kg", barcode: "7891234567895" }).success).toBe(false);
    expect(erp.productInputSchema.safeParse({ ...base, barcode: erp.buildScaleLabel("00101", 500) }).success).toBe(false);
  });
});

describe("pagamentos do PDV", () => {
  const pay = (method: erp.PaymentMethod, amountCents: number) => ({ method, amountCents });

  it("troco só do que sobra em dinheiro", () => {
    expect(settlePayments([pay("cash", 5000)], 4210)).toBe(790);
    expect(settlePayments([pay("pix", 4210)], 4210)).toBe(0);
    expect(settlePayments([pay("debit", 2000), pay("cash", 3000)], 4210)).toBe(790);
  });

  it("recusa falta de pagamento e cartão/Pix acima do total", () => {
    expect(() => settlePayments([pay("pix", 4000)], 4210)).toThrow(/faltam R\$\s2,10/);
    expect(() => settlePayments([pay("credit", 5000)], 4210)).toThrow(/Cartão e Pix/);
  });

  it("impressão digital ignora a ordem dos itens e dos pagamentos", () => {
    const a = { items: [{ productId: "a", quantity: 1 }, { productId: "b", quantity: 2 }], discountCents: 0, payments: [pay("pix", 1), pay("cash", 2)] };
    const b = { items: [{ productId: "b", quantity: 2 }, { productId: "a", quantity: 1 }], discountCents: 0, payments: [pay("cash", 2), pay("pix", 1)] };
    expect(fingerprint(a)).toBe(fingerprint(b));
    expect(fingerprint({ ...a, discountCents: 1 })).not.toBe(fingerprint(a));
  });
});
