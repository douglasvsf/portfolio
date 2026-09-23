import { resolveLocale } from "./config";

describe("resolveLocale", () => {
  it("prioriza o idioma salvo no cookie", () => {
    expect(resolveLocale({ cookie: "es-ES", acceptLanguage: "en-US,en;q=0.9" })).toBe("es-ES");
  });

  it("ignora cookie com valor que não é um locale suportado", () => {
    expect(resolveLocale({ cookie: "fr-FR", acceptLanguage: "en-US" })).toBe("en-US");
  });

  it("usa o Accept-Language respeitando o peso (q)", () => {
    expect(resolveLocale({ acceptLanguage: "fr;q=0.9,es-ES;q=0.8,en;q=0.5" })).toBe("es-ES");
  });

  it("casa pelo idioma quando a região não é suportada", () => {
    expect(resolveLocale({ acceptLanguage: "es-MX" })).toBe("es-ES");
    expect(resolveLocale({ acceptLanguage: "pt-PT" })).toBe("pt-BR");
    expect(resolveLocale({ acceptLanguage: "en-GB,en;q=0.9" })).toBe("en-US");
  });

  it("cai no português quando nada é compatível ou o header está ausente", () => {
    expect(resolveLocale({ acceptLanguage: "de-DE,fr;q=0.8" })).toBe("pt-BR");
    expect(resolveLocale({ acceptLanguage: null })).toBe("pt-BR");
    expect(resolveLocale({})).toBe("pt-BR");
  });
});
