/**
 * Ciclo completo com um .xlsx de verdade: escreve uma planilha no formato da
 * B3, lê com o mesmo leitor usado no navegador e importa.
 */
import { readSheet } from "read-excel-file/node";
import writeExcelFile from "write-excel-file/node";
import { parseB3Rows } from "./b3-import";
import { computePositions } from "./positions";

const cell = (value: string | number) => (typeof value === "number" ? { value, type: Number } : { value, type: String });

it("importa um .xlsx no formato de Movimentação da B3", async () => {
  const rows: (string | number)[][] = [
    ["Entrada/Saída", "Data", "Movimentação", "Produto", "Instituição", "Quantidade", "Preço unitário", "Valor da Operação"],
    ["Credito", "15/01/2025", "Transferência - Liquidação", "PETR4 - PETROLEO BRASILEIRO S.A. PETROBRAS", "XP", 100, 37.2, 3720],
    ["Debito", "10/11/2025", "Transferência - Liquidação", "PETR4 - PETROLEO BRASILEIRO S.A. PETROBRAS", "XP", 40, 34.5, 1380],
    ["Credito", "19/12/2025", "Juros Sobre Capital Próprio", "PETR4 - PETROLEO BRASILEIRO S.A. PETROBRAS", "XP", 60, "-", 21.6],
    ["Credito", "05/01/2026", "Juros", "Tesouro Selic 2029", "XP", 1, "-", 12.3],
  ];
  const buffer = await writeExcelFile(rows.map((row) => row.map(cell))).toBuffer();

  const result = parseB3Rows(await readSheet(buffer));

  expect(result.format).toBe("movements");
  expect(result.transactions.map((t) => t.kind)).toEqual(["buy", "sell", "income"]);
  expect(result.skipped).toHaveLength(1);
  const [position] = computePositions(result.transactions);
  expect(position).toMatchObject({ ticker: "PETR4", quantity: 60, income: 21.6 });
  expect(position.averagePrice).toBeCloseTo(37.2);
  expect(position.realized).toBeCloseTo(40 * (34.5 - 37.2));
});
