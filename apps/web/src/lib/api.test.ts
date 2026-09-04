import { getExperience, getHealth, getProjects, getSkills } from "./api";

const originalFetch = global.fetch;
const originalConsoleWarn = console.warn;

afterEach(() => {
  global.fetch = originalFetch;
  console.warn = originalConsoleWarn;
  jest.restoreAllMocks();
});

describe("getHealth", () => {
  it("deve retornar o status quando a API responde com sucesso", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ status: "ok" }),
    }) as unknown as typeof fetch;

    const result = await getHealth();

    expect(result).toEqual({ status: "ok" });
    expect(global.fetch).toHaveBeenCalledWith("http://localhost:3001/health", {
      cache: "no-store",
    });
  });

  it("deve lançar um erro quando a API responde com status de erro", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
    }) as unknown as typeof fetch;

    await expect(getHealth()).rejects.toThrow("API respondeu com status 500");
  });
});

describe("getSkills", () => {
  it("deve retornar os grupos de skills quando a API responde com sucesso", async () => {
    const skillGroups = [{ category: "Frontend", items: ["React"] }];
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(skillGroups),
    }) as unknown as typeof fetch;

    const result = await getSkills();

    expect(result).toEqual(skillGroups);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/skills",
      expect.objectContaining({ next: { revalidate: 60 } }),
    );
  });

  it("deve retornar uma lista vazia quando a API está indisponível, sem lançar erro", async () => {
    console.warn = jest.fn();
    global.fetch = jest.fn().mockRejectedValue(new Error("fetch failed")) as unknown as typeof fetch;

    const result = await getSkills();

    expect(result).toEqual([]);
    expect(console.warn).toHaveBeenCalled();
  });
});

describe("getProjects", () => {
  it("deve buscar os projetos no endpoint correto", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    }) as unknown as typeof fetch;

    await getProjects();

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/projects",
      expect.objectContaining({ next: { revalidate: 60 } }),
    );
  });
});

describe("getExperience", () => {
  it("deve buscar a experiência no endpoint correto", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([]),
    }) as unknown as typeof fetch;

    await getExperience();

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:3001/experience",
      expect.objectContaining({ next: { revalidate: 60 } }),
    );
  });
});
