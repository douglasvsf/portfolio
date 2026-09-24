import { normalizeTicker, parseB3Rows, parseDate, parseNumber } from "./b3-import";
import { demoTransactions } from "./demo";
import { computePositions, guessAssetClass, toSlices, valuePortfolio } from "./positions";
import { marketOf, normalizeAssetCode, portfolioSchema, transactionFingerprint, type Transaction } from "./schema";
import { mergeTransactions, parsePortfolio } from "./store";
import { contractReporter } from "@/lib/http/contract";

/** Omit distributivo: preserva cada variante da união. */
type Draft = Transaction extends infer T ? (T extends Transaction ? Omit<T, "id" | "source"> : never) : never;

let seq = 0;
const tx = (partial: Draft) => ({ id: `t${++seq}`, source: "manual", ...partial }) as Transaction;
const buy = (ticker: string, date: string, quantity: number, price: number, fees = 0) => tx({ kind: "buy", ticker, date, quantity, price, fees });
const sell = (ticker: string, date: string, quantity: number, price: number, fees = 0) => tx({ kind: "sell", ticker, date, quantity, price, fees });

describe("preço médio e resultado", () => {
  it("compras somam custo com taxas; venda realiza contra o preço médio", () => {
    const [position] = computePositions([
      buy("PETR4", "2025-01-10", 100, 30, 5),
      buy("PETR4", "2025-02-10", 100, 40, 5),
      sell("PETR4", "2025-03-10", 50, 50, 2),
    ]);
    // Médio: (3005 + 4005) / 200 = 35,05
    expect(position.quantity).toBe(150);
    expect(position.averagePrice).toBeCloseTo(35.05);
    expect(position.cost).toBeCloseTo(150 * 35.05);
    // Realizado: 50 × 50 − 2 − 50 × 35,05
    expect(position.realized).toBeCloseTo(2500 - 2 - 1752.5);
    expect(position.bought).toBeCloseTo(7010);
  });

  it("vender tudo zera a posição e mantém o realizado", () => {
    const [position] = computePositions([buy("VALE3", "2025-01-01", 10, 60), sell("VALE3", "2025-02-01", 10, 50)]);
    expect(position).toMatchObject({ quantity: 0, cost: 0, averagePrice: 0 });
    expect(position.realized).toBeCloseTo(-100);
  });

  it("ordena por data, mesmo lançadas fora de ordem; no mesmo dia, compra antes da venda", () => {
    const [position] = computePositions([sell("ITUB4", "2025-05-01", 10, 40), buy("ITUB4", "2025-05-01", 10, 30)]);
    expect(position.issues).toEqual([]);
    expect(position.realized).toBeCloseTo(100);
  });

  it("venda acima do que foi comprado é sinalizada, sem ficar negativa", () => {
    const [position] = computePositions([buy("WEGE3", "2025-01-01", 10, 40), sell("WEGE3", "2025-02-01", 15, 50)]);
    expect(position.quantity).toBe(0);
    expect(position.issues).toEqual(["oversold"]);
    expect(position.realized).toBeCloseTo(100); // só as 10 que existiam
  });

  it("desdobro aumenta a quantidade sem custo; grupamento troca a quantidade mantendo o custo", () => {
    const [position] = computePositions([
      buy("MGLU3", "2025-01-01", 100, 10),
      tx({ kind: "bonus", ticker: "MGLU3", date: "2025-02-01", quantity: 100 }),
      tx({ kind: "merge", ticker: "MGLU3", date: "2025-03-01", quantity: 20 }),
    ]);
    expect(position.quantity).toBe(20);
    expect(position.cost).toBe(1000);
    expect(position.averagePrice).toBe(50);
  });

  it("proventos somam por ativo", () => {
    const [position] = computePositions([
      buy("MXRF11", "2025-01-01", 100, 10),
      tx({ kind: "income", ticker: "MXRF11", date: "2025-02-15", amount: 9 }),
      tx({ kind: "income", ticker: "MXRF11", date: "2025-03-15", amount: 9 }),
    ]);
    expect(position.income).toBe(18);
  });
});

describe("valorização da carteira", () => {
  const positions = computePositions([
    buy("PETR4", "2025-01-10", 100, 30),
    buy("MXRF11", "2025-02-01", 100, 10),
    tx({ kind: "income", ticker: "MXRF11", date: "2025-03-15", amount: 10 }),
    buy("VALE3", "2025-01-01", 10, 60),
    sell("VALE3", "2025-02-01", 10, 70),
  ]);

  it("calcula patrimônio, resultados e pesos com as cotações", () => {
    const { open, closed, summary } = valuePortfolio(positions, {
      PETR4: { price: 40, change: 1.5, assetClass: "stock" },
      MXRF11: { price: 9, change: -0.2, assetClass: "fii" },
    });
    expect(summary.marketValue).toBe(4000 + 900);
    expect(summary.cost).toBe(3000 + 1000);
    expect(summary.unrealized).toBe(1000 - 100);
    expect(summary.realized).toBe(100);
    expect(summary.income).toBe(10);
    expect(summary.totalReturn).toBe(900 + 100 + 10);
    expect(summary.totalReturnPercent).toBeCloseTo((1010 / 4600) * 100);
    expect(summary.firstDate).toBe("2025-01-01");
    expect(open.map((p) => p.ticker)).toEqual(["PETR4", "MXRF11"]);
    expect(open[0].weight).toBeCloseTo((4000 / 4900) * 100);
    expect(open[0].unrealizedPercent).toBeCloseTo(33.33, 1);
    expect(closed.map((p) => p.ticker)).toEqual(["VALE3"]);
  });

  it("sem cotação, o ativo entra pelo custo e sem resultado em aberto", () => {
    const { open, summary } = valuePortfolio(positions, {});
    expect(open.every((p) => !p.hasQuote && p.unrealizedPercent === null)).toBe(true);
    expect(summary.marketValue).toBe(summary.cost);
    expect(open.find((p) => p.ticker === "MXRF11")?.assetClass).toBe("fii");
  });

  it("classe pelo ticker quando a brapi não informa", () => {
    expect(guessAssetClass("PETR4")).toBe("stock");
    expect(guessAssetClass("BOVA11")).toBe("fii");
    expect(guessAssetClass("AAPL34")).toBe("bdr");
    expect(guessAssetClass("BTC")).toBe("crypto");
  });

  it("fatias dos gráficos: as maiores + outros", () => {
    const items = [5, 4, 3, 2, 1].map((value, index) => ({ key: `K${index}`, value }));
    expect(toSlices(items, (i) => i.key, (i) => i.value, 3)).toEqual([
      { key: "K0", value: 5 },
      { key: "K1", value: 4 },
      { key: "others", value: 6 },
    ]);
  });

  it("a carteira de exemplo é válida e sem vendas a descoberto", () => {
    const demo = demoTransactions();
    expect(portfolioSchema.safeParse({ version: 1, transactions: demo }).success).toBe(true);
    expect(computePositions(demo).flatMap((p) => p.issues)).toEqual([]);
  });
});

describe("importação da planilha da B3", () => {
  const MOVEMENTS_HEADER = ["Entrada/Saída", "Data", "Movimentação", "Produto", "Instituição", "Quantidade", "Preço unitário", "Valor da Operação"];

  it("extrato de Movimentação: compras, vendas, proventos e eventos", () => {
    const result = parseB3Rows([
      MOVEMENTS_HEADER,
      ["Credito", "15/01/2025", "Transferência - Liquidação", "PETR4 - PETROLEO BRASILEIRO S.A. PETROBRAS", "XP INVESTIMENTOS", 100, 37.2, 3720],
      ["Debito", "10/11/2025", "Transferência - Liquidação", "PETR4 - PETROLEO BRASILEIRO S.A. PETROBRAS", "XP INVESTIMENTOS", "40", "R$ 34,50", "R$ 1.380,00"],
      ["Credito", new Date(Date.UTC(2025, 8, 15)), "Rendimento", "MXRF11 - MAXI RENDA FDO INV IMOB", "XP INVESTIMENTOS", 300, 0.09, 27],
      ["Credito", "20/02/2026", "Juros Sobre Capital Próprio", "ITUB4 - ITAU UNIBANCO HOLDING S.A.", "XP", 80, "-", 12.5],
      ["Credito", "01/03/2026", "Desdobro", "MGLU3 - MAGAZINE LUIZA S/A", "XP", 100, "-", "-"],
      ["Credito", "01/04/2026", "Grupamento", "MGLU3 - MAGAZINE LUIZA S/A", "XP", 20, "-", "-"],
      ["Credito", "05/04/2026", "Transferência - Liquidação", "BOVA11 - ISHARES BOVA", "XP", 10, "-", "1.284,00"],
      ["Credito", "02/01/2025", "Juros", "Tesouro Selic 2029", "XP", 1, "-", 10],
      ["Credito", "02/01/2025", "Empréstimo", "PETR4 - PETROLEO", "XP", 10, "-", "-"],
      [],
    ]);

    expect(result.format).toBe("movements");
    expect(result.transactions.map((t) => [t.kind, t.ticker, t.date])).toEqual([
      ["buy", "PETR4", "2025-01-15"],
      ["sell", "PETR4", "2025-11-10"],
      ["income", "MXRF11", "2025-09-15"],
      ["income", "ITUB4", "2026-02-20"],
      ["bonus", "MGLU3", "2026-03-01"],
      ["merge", "MGLU3", "2026-04-01"],
      ["buy", "BOVA11", "2026-04-05"],
    ]);
    expect(result.transactions[1]).toMatchObject({ quantity: 40, price: 34.5, source: "b3" });
    expect(result.transactions[3]).toMatchObject({ amount: 12.5 });
    // Preço "-" é derivado de valor ÷ quantidade.
    expect(result.transactions[6]).toMatchObject({ price: 128.4 });
    expect(result.skipped).toEqual([
      { row: 9, reason: "unsupported", label: "Juros" },
      { row: 10, reason: "unsupported", label: "Empréstimo" },
    ]);
  });

  it("extrato de Negociação, com cabeçalho abaixo de linhas de título e fracionário", () => {
    const result = parseB3Rows([
      ["Extrato de negociação"],
      ["Data do Negócio", "Tipo de Movimentação", "Mercado", "Prazo/Vencimento", "Instituição", "Código de Negociação", "Quantidade", "Preço", "Valor"],
      ["14/03/2025", "Compra", "Mercado Fracionário", "-", "NU INVEST", "WEGE3F", 7, 45.3, 317.1],
      ["20/03/2025", "Venda", "Mercado à Vista", "-", "NU INVEST", "WEGE3", 7, 50, 350],
      ["21/03/2025", "Compra", "Mercado à Vista", "-", "NU INVEST", "", 7, 50, 350],
    ]);
    expect(result.format).toBe("trades");
    expect(result.transactions.map((t) => [t.kind, t.ticker, t.date])).toEqual([
      ["buy", "WEGE3", "2025-03-14"],
      ["sell", "WEGE3", "2025-03-20"],
    ]);
    expect(result.skipped).toEqual([{ row: 5, reason: "notAsset", label: "Compra" }]);
  });

  it("linha com valor inválido é ignorada com motivo", () => {
    const result = parseB3Rows([MOVEMENTS_HEADER, ["Credito", "31/13/2025", "Transferência - Liquidação", "PETR4 - X", "XP", 10, 30, 300]]);
    expect(result.transactions).toEqual([]);
    expect(result.skipped).toEqual([{ row: 2, reason: "invalid", label: "Transferência - Liquidação" }]);
  });

  it("planilha desconhecida não importa nada", () => {
    expect(parseB3Rows([["Nome", "Idade"], ["x", 1]])).toEqual({ format: null, transactions: [], skipped: [] });
  });

  it("helpers de célula", () => {
    expect(parseNumber("1.234,56")).toBe(1234.56);
    expect(parseNumber("R$ 0,09")).toBe(0.09);
    expect(parseNumber("-")).toBeNaN();
    expect(parseNumber(12)).toBe(12);
    expect(parseDate("05/04/2026")).toBe("2026-04-05");
    expect(parseDate("ontem")).toBe("");
    expect(normalizeTicker(" petr4f ")).toBe("PETR4");
    expect(normalizeTicker("Tesouro")).toBeNull();
  });
});

describe("ativos: B3 e cripto", () => {
  it("normaliza o que o usuário digita e identifica o mercado", () => {
    expect(normalizeAssetCode(" petr4f ")).toBe("PETR4");
    expect(normalizeAssetCode("btc")).toBe("BTC");
    expect(normalizeAssetCode("usdt")).toBe("USDT");
    expect(normalizeAssetCode("1000")).toBeNull();
    expect(normalizeAssetCode("tesouro selic")).toBeNull();
    expect(marketOf("MXRF11")).toBe("b3");
    expect(marketOf("ETH")).toBe("crypto");
  });

  it("frações de cripto entram no preço médio", () => {
    const [position] = computePositions([buy("BTC", "2025-03-10", 0.01, 490000), buy("BTC", "2025-06-01", 0.005, 580000)]);
    expect(position.quantity).toBeCloseTo(0.015);
    expect(position.averagePrice).toBeCloseTo(520000);
  });
});

describe("armazenamento local", () => {
  it("mescla sem duplicar a mesma operação", () => {
    const a = buy("PETR4", "2025-01-01", 10, 30);
    const again = { ...a, id: "outro-id" };
    const result = mergeTransactions([a], [again, buy("VALE3", "2025-01-01", 1, 60)]);
    expect(result.added).toBe(1);
    expect(result.duplicates).toBe(1);
    expect(transactionFingerprint(a)).toBe(transactionFingerprint(again));
  });

  it("dado salvo corrompido não quebra: vira carteira vazia ou descarta só o item ruim", () => {
    const report = jest.spyOn(contractReporter, "report").mockImplementation(() => {});
    expect(parsePortfolio("{nada")).toEqual({ version: 1, transactions: [] });
    expect(parsePortfolio(null).transactions).toEqual([]);
    const saved = JSON.stringify({ version: 1, transactions: [buy("PETR4", "2025-01-01", 10, 30), { kind: "buy", ticker: "??" }] });
    expect(parsePortfolio(saved).transactions).toHaveLength(1);
    expect(report).toHaveBeenCalledWith(expect.objectContaining({ dropped: 1 }));
    report.mockRestore();
  });
});
