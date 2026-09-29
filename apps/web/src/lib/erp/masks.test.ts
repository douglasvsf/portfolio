import { erp } from "@portfolio/shared";
import { parseMoneyToCents, parseQuantity } from "./format";
import { applyMask, centsToMasked, maskDocument, maskMoney, maskPhone, maskQuantity, maskSku, quantityMask, quantityToMasked } from "./masks";

describe("máscaras do ERP", () => {
  it("SKU: maiúsculo, sem caractere inválido e no máximo 20", () => {
    expect(maskSku("mer-arr 5kg!")).toBe("MER-ARR5KG");
    expect(maskSku("a".repeat(30))).toHaveLength(20);
  });

  it("CPF vira CNPJ a partir do 12º dígito, e o resultado passa no schema", () => {
    expect(maskDocument("529")).toBe("529");
    expect(maskDocument("5299")).toBe("529.9");
    expect(maskDocument("5299822")).toBe("529.982.2");
    expect(maskDocument("52998224725")).toBe("529.982.247-25");
    expect(maskDocument("112223330001")).toBe("11.222.333/0001");
    expect(maskDocument("11222333000181999")).toBe("11.222.333/0001-81");
    expect(erp.customerInputSchema.shape.document.safeParse(maskDocument("11222333000181")).success).toBe(true);
  });

  it("telefone fixo e celular com DDD", () => {
    expect(maskPhone("")).toBe("");
    expect(maskPhone("4")).toBe("(4");
    expect(maskPhone("449")).toBe("(44) 9");
    expect(maskPhone("4432221111")).toBe("(44) 3222-1111");
    expect(maskPhone("44999990000123")).toBe("(44) 99999-0000");
  });

  it("dinheiro entra pelos centavos e volta certo para centavos", () => {
    expect(maskMoney("")).toBe("");
    expect(maskMoney("0")).toBe("");
    expect(maskMoney("5")).toBe("0,05");
    expect(maskMoney("R$ 12,90")).toBe("12,90");
    expect(maskMoney("123456")).toBe("1.234,56");
    expect(maskMoney("99999999999")).toBe("9.999.999,99");
    expect(parseMoneyToCents(maskMoney("123456"))).toBe(123456);
    expect(centsToMasked(2990)).toBe("29,90");
  });

  it("quantidade: inteira para unidade, até 3 casas para kg/L, teto de 1 milhão", () => {
    expect(maskQuantity("12,5", "un")).toBe("12");
    expect(maskQuantity("1500", "un")).toBe("1.500");
    expect(maskQuantity("1,2567", "kg")).toBe("1,256");
    expect(maskQuantity(",5", "l")).toBe("0,5");
    expect(maskQuantity("007", "kg")).toBe("7");
    expect(maskQuantity("99999999", "un")).toBe("1.000.000");
    expect(maskQuantity("abc", "kg")).toBe("");
    expect(parseQuantity(maskQuantity("1234,5", "kg"))).toBe(1234.5);
    expect(quantityToMasked(17.5, "kg")).toBe("17,5");
  });

  it("applyMask escolhe a máscara pelo tipo", () => {
    expect(applyMask("sku", "ab")).toBe("AB");
    expect(applyMask("document", "52998224725")).toBe("529.982.247-25");
    expect(applyMask("phone", "4432221111")).toBe("(44) 3222-1111");
    expect(applyMask("money", "1290")).toBe("12,90");
    expect(applyMask(quantityMask("un"), "2,5")).toBe("2");
    expect(applyMask(quantityMask("kg"), "2,5")).toBe("2,5");
  });
});
