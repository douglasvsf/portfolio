import { locales } from "@/i18n/config";
import { PROJECT_DATA, SNAPSHOT } from "./data";
import { enUS } from "./en-US";
import { esES } from "./es-ES";
import { CASE_IDS, adjacentCases, getProject, getProjects, getSnapshot } from "./index";
import { ptBR } from "./pt-BR";

/** Caminhos de todas as folhas (strings) — para comparar a estrutura entre idiomas. */
function leafPaths(value: unknown, prefix = ""): string[] {
  if (typeof value === "string") return [prefix];
  if (Array.isArray(value)) return value.flatMap((item, index) => leafPaths(item, `${prefix}[${index}]`));
  if (value && typeof value === "object") return Object.entries(value).flatMap(([key, child]) => leafPaths(child, prefix ? `${prefix}.${key}` : key));
  return [];
}

describe("projetos — dados", () => {
  it("ids únicos e em formato de slug", () => {
    const ids = PROJECT_DATA.map((project) => project.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id) => expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/));
  });

  it("todo projeto tem texto em todos os idiomas, sem texto sobrando", () => {
    for (const copy of [ptBR, enUS, esES]) {
      expect(Object.keys(copy.projects).sort()).toEqual(PROJECT_DATA.map((project) => project.id).sort());
    }
  });

  it("os três idiomas têm exatamente a mesma estrutura de textos", () => {
    const expected = leafPaths(ptBR).sort();
    expect(leafPaths(enUS).sort()).toEqual(expected);
    expect(leafPaths(esES).sort()).toEqual(expected);
  });

  it("profissionais têm empresa, site e case completo; pessoais têm link do produto e do código", () => {
    for (const locale of locales) {
      for (const project of getProjects(locale)) {
        expect(project.technologies.length).toBeGreaterThan(0);
        expect(project.technologies.length).toBeLessThanOrEqual(6);
        if (project.category === "professional") {
          expect(project).toMatchObject({ hasCase: true, company: expect.any(String), companyUrl: expect.stringMatching(/^https:\/\//) });
          expect(project.case?.role.length).toBeGreaterThan(0);
          expect(project.case?.architecture.length).toBeGreaterThanOrEqual(3);
          expect(project.case?.decisions.length).toBeGreaterThan(0);
        } else {
          expect(project).toMatchObject({ hasCase: false, liveUrl: expect.stringMatching(/^\//), codeUrl: expect.stringMatching(/^https:\/\/github\.com\//) });
          expect(project.case).toBeUndefined();
        }
      }
    }
  });

  it("toda métrica tem rótulo em todos os idiomas", () => {
    for (const locale of locales) {
      getProjects(locale)
        .flatMap((project) => project.metrics)
        .forEach((metric) => expect(metric.label).toEqual(expect.any(String)));
    }
  });

  it("cada número do snapshot vem de um case: é métrica ou está no texto dele", () => {
    for (const item of SNAPSHOT) {
      const project = getProject("pt-BR", item.projectId);
      expect(project).toBeDefined();
      const inMetrics = project!.metrics.some((metric) => metric.value === item.value);
      const digits = item.value.replace(/\D/g, "");
      const inText = JSON.stringify(project!.case).includes(digits);
      expect(inMetrics || inText).toBe(true);
    }
    expect(getSnapshot("en-US").map((item) => item.label)).toEqual(Object.values(enUS.snapshot));
  });
});

describe("projetos — navegação entre cases", () => {
  it("CASE_IDS são os profissionais, na ordem da página", () => {
    expect(CASE_IDS).toEqual(PROJECT_DATA.filter((project) => project.category === "professional").map((project) => project.id));
  });

  it("anterior/próximo nas pontas e no meio", () => {
    const [first, second] = CASE_IDS;
    const last = CASE_IDS.at(-1)!;
    expect(adjacentCases("pt-BR", first)).toMatchObject({ previous: undefined, next: { id: second } });
    expect(adjacentCases("pt-BR", second)).toMatchObject({ previous: { id: first } });
    expect(adjacentCases("pt-BR", last).next).toBeUndefined();
    expect(adjacentCases("pt-BR", "nao-existe")).toEqual({ previous: undefined, next: undefined });
  });

  it("projeto inexistente não quebra", () => {
    expect(getProject("pt-BR", "nao-existe")).toBeUndefined();
  });
});
