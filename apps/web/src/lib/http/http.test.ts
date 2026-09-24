import { z } from "zod";
import { ContractError, contractReporter, formatIssues, parseContract, resilientArray } from "./contract";
import { backoffDelay, retryRuntime, withRetry } from "./retry";

const transient = new Error("transient");
const fatal = new Error("fatal");
const retryable = (error: unknown) => ({ retry: error === transient });

describe("withRetry", () => {
  let sleeps: number[];
  const originalSleep = retryRuntime.sleep;
  const originalRandom = retryRuntime.random;

  beforeEach(() => {
    sleeps = [];
    retryRuntime.sleep = async (ms) => {
      sleeps.push(ms);
    };
    retryRuntime.random = () => 0.5;
  });

  afterEach(() => {
    retryRuntime.sleep = originalSleep;
    retryRuntime.random = originalRandom;
  });

  it("devolve na primeira tentativa sem esperar", async () => {
    await expect(withRetry(async () => "ok", { retryable })).resolves.toBe("ok");
    expect(sleeps).toEqual([]);
  });

  it("repete falhas transitórias com backoff exponencial + jitter", async () => {
    const task = jest.fn().mockRejectedValueOnce(transient).mockRejectedValueOnce(transient).mockResolvedValue("ok");
    await expect(withRetry(task, { retryable })).resolves.toBe("ok");
    expect(task).toHaveBeenCalledTimes(3);
    expect(sleeps).toEqual([450, 750]); // 300·2⁰ + 150, 300·2¹ + 150
  });

  it("desiste depois de esgotar as tentativas", async () => {
    const task = jest.fn().mockRejectedValue(transient);
    await expect(withRetry(task, { retryable, retries: 1 })).rejects.toBe(transient);
    expect(task).toHaveBeenCalledTimes(2);
  });

  it("não repete erro permanente", async () => {
    const task = jest.fn().mockRejectedValue(fatal);
    await expect(withRetry(task, { retryable })).rejects.toBe(fatal);
    expect(task).toHaveBeenCalledTimes(1);
  });

  it("respeita a espera pedida pelo servidor, mas não além do teto", async () => {
    const task = jest.fn().mockRejectedValueOnce(transient).mockResolvedValue("ok");
    await withRetry(task, { retryable: () => ({ retry: true, afterMs: 1000 }) });
    expect(sleeps).toEqual([1000]);

    const slow = jest.fn().mockRejectedValue(transient);
    await expect(withRetry(slow, { retryable: () => ({ retry: true, afterMs: 60_000 }) })).rejects.toBe(transient);
    expect(slow).toHaveBeenCalledTimes(1);
  });

  it("backoff nunca passa do teto", () => {
    expect(backoffDelay(10, 300, 3000)).toBe(3000);
  });
});

describe("contrato", () => {
  let reports: jest.SpyInstance;
  beforeEach(() => {
    reports = jest.spyOn(contractReporter, "report").mockImplementation(() => {});
  });
  afterEach(() => reports.mockRestore());

  const schema = z.object({ id: z.string(), items: resilientArray(z.object({ n: z.number() }), "teste itens") });

  it("dados válidos passam sem relatório", () => {
    expect(parseContract(schema, { id: "a", items: [{ n: 1 }] }, "teste")).toEqual({ id: "a", items: [{ n: 1 }] });
    expect(reports).not.toHaveBeenCalled();
  });

  it("violação do essencial vira ContractError e é reportada", () => {
    const run = () => parseContract(schema, { id: 1, items: [] }, "teste");
    expect(run).toThrow(ContractError);
    expect(run).toThrow(/Resposta fora do contrato em teste: id:/);
    expect(reports).toHaveBeenCalledWith(expect.objectContaining({ source: "teste" }));
  });

  it("lista descarta só os itens inválidos e conta quantos saíram", () => {
    const data = parseContract(schema, { id: "a", items: [{ n: 1 }, { n: "x" }, null, { n: 2 }] }, "teste");
    expect(data.items).toEqual([{ n: 1 }, { n: 2 }]);
    expect(reports).toHaveBeenCalledWith(expect.objectContaining({ source: "teste itens", dropped: 2 }));
  });

  it("lista que nem é lista quebra o contrato", () => {
    expect(() => parseContract(schema, { id: "a", items: "nope" }, "teste")).toThrow(ContractError);
  });

  it("formatIssues aponta o caminho e limita a quantidade", () => {
    const result = z.object({ a: z.object({ b: z.string() }), c: z.number() }).safeParse({ a: { b: 1 }, c: "x" });
    if (result.success) throw new Error("deveria falhar");
    expect(formatIssues(result.error, 1)).toEqual([expect.stringMatching(/^a\.b: /)]);
    const root = z.string().safeParse(1);
    if (root.success) throw new Error("deveria falhar");
    expect(formatIssues(root.error)[0]).toMatch(/^\(raiz\): /);
  });

  it("relatório padrão vai para console.warn com prefixo", () => {
    reports.mockRestore();
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    contractReporter.report({ source: "x", message: "m", dropped: 1 });
    expect(warn).toHaveBeenCalledWith("[contract] x: m (1 item(s) descartado(s))");
    warn.mockRestore();
    reports = jest.spyOn(contractReporter, "report").mockImplementation(() => {});
  });
});
