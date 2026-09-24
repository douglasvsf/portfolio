const cookieJar = new Map<string, string>();
const headerJar = new Map<string, string>();
jest.mock("next/headers", () => ({
  cookies: async () => ({ get: (name: string) => (cookieJar.has(name) ? { name, value: cookieJar.get(name) } : undefined) }),
  headers: async () => ({ get: (name: string) => headerJar.get(name) ?? null }),
}));

import { getRequestLocale } from "./request";

beforeEach(() => {
  cookieJar.clear();
  headerJar.clear();
});

describe("getRequestLocale (sistemas sem locale na URL)", () => {
  it("a escolha das bandeiras (cookie) vence o navegador", async () => {
    cookieJar.set("NEXT_LOCALE", "es-ES");
    headerJar.set("accept-language", "en-US,en;q=0.9");
    await expect(getRequestLocale()).resolves.toBe("es-ES");
  });

  it("sem cookie, usa o idioma do navegador; sem nada, pt-BR", async () => {
    headerJar.set("accept-language", "en-GB,en;q=0.9");
    await expect(getRequestLocale()).resolves.toBe("en-US");
    headerJar.clear();
    await expect(getRequestLocale()).resolves.toBe("pt-BR");
  });
});
