import { fmt } from "./message";

describe("fmt", () => {
  it("substitui as variáveis e mantém as desconhecidas", () => {
    expect(fmt("{n} de {total} · {x}", { n: 3, total: "50" })).toBe("3 de 50 · {x}");
  });
});
