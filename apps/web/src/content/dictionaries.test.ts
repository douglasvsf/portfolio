import { enUS as spotifyEn } from "./spotify/en-US";
import { esES as spotifyEs } from "./spotify/es-ES";
import { ptBR as spotifyPt } from "./spotify/pt-BR";
import { enUS as stocksEn } from "./stocks/en-US";
import { esES as stocksEs } from "./stocks/es-ES";
import { ptBR as stocksPt } from "./stocks/pt-BR";

/** Caminhos de todas as folhas (strings) de um dicionário, ex.: "overview.title". */
function leafPaths(value: unknown, prefix = ""): string[] {
  if (typeof value === "string") return [prefix];
  if (Array.isArray(value)) return value.flatMap((item, index) => leafPaths(item, `${prefix}[${index}]`));
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, child]) => leafPaths(child, prefix ? `${prefix}.${key}` : key));
  }
  return [];
}

/** Variáveis {x} usadas em cada texto — a tradução precisa manter as mesmas. */
function variables(dict: unknown) {
  const result: Record<string, string[]> = {};
  const walk = (value: unknown, path: string) => {
    if (typeof value === "string") result[path] = [...value.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
    else if (value && typeof value === "object") for (const [key, child] of Object.entries(value)) walk(child, path ? `${path}.${key}` : key);
  };
  walk(dict, "");
  return result;
}

describe.each([
  ["Spotify Stats", spotifyPt, spotifyEn, spotifyEs],
  // Setores: o en-US usa os nomes originais da brapi, então fica de fora da comparação de chaves.
  ["Kaiju Stocks", { ...stocksPt, sectors: {} }, { ...stocksEn, sectors: {} }, { ...stocksEs, sectors: {} }],
])("dicionário do %s", (_name, pt, en, es) => {
  it("tem exatamente os mesmos textos nos 3 idiomas", () => {
    const expected = leafPaths(pt).sort();
    expect(leafPaths(en).sort()).toEqual(expected);
    expect(leafPaths(es).sort()).toEqual(expected);
  });

  it("mantém as mesmas variáveis {x} em cada tradução", () => {
    expect(variables(en)).toEqual(variables(pt));
    expect(variables(es)).toEqual(variables(pt));
  });

  it("não tem textos vazios", () => {
    for (const dict of [pt, en, es]) {
      const empty = Object.entries(variables(dict)).filter(([path]) => {
        const value = path.split(".").reduce<unknown>((node, key) => (node as Record<string, unknown>)?.[key], dict);
        return typeof value === "string" && value.trim() === "";
      });
      expect(empty).toEqual([]);
    }
  });
});
