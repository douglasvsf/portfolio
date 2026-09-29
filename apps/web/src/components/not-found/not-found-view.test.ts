import { NOT_FOUND_COPY } from "@/content/not-found";
import { locales } from "@/i18n/config";
import { localeFromPath } from "./not-found-view";

jest.mock("next/navigation", () => ({ usePathname: () => "/" }));

describe("página 404", () => {
  it("idioma pelo começo do endereço; sem prefixo válido, pt-BR", () => {
    expect(localeFromPath("/es-ES/xyz")).toBe("es-ES");
    expect(localeFromPath("/en-US")).toBe("en-US");
    expect(localeFromPath("/qualquer-coisa")).toBe("pt-BR");
    expect(localeFromPath(null)).toBe("pt-BR");
  });

  it("textos completos nos três idiomas", () => {
    const keys = Object.keys(NOT_FOUND_COPY["pt-BR"]).sort();
    for (const locale of locales) {
      expect(Object.keys(NOT_FOUND_COPY[locale]).sort()).toEqual(keys);
      expect(NOT_FOUND_COPY[locale].command).toContain("{path}");
    }
  });
});
