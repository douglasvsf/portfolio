import { fmt, plural } from "./message";

describe("fmt", () => {
  it("substitui as variáveis e mantém as desconhecidas", () => {
    expect(fmt("{n} de {total} · {x}", { n: 3, total: "50" })).toBe("3 de 50 · {x}");
  });
});

describe("plural", () => {
  it("usa as regras do idioma", () => {
    const forms = { one: "{n} música", other: "{n} músicas" };
    expect(plural(forms, 1, "pt-BR")).toBe("1 música");
    expect(plural(forms, 1234, "pt-BR")).toBe("1.234 músicas");
    expect(plural({ one: "{n} track", other: "{n} tracks" }, 0, "en-US")).toBe("0 tracks");
  });
});
