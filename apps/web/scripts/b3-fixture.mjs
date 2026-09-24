/**
 * Gera `cypress/fixtures/b3-movimentacao.xlsx`: uma planilha no formato do
 * extrato de Movimentação da Área do Investidor da B3 (mesmas colunas, datas
 * como texto dd/mm/aaaa e "-" nos campos vazios, como a B3 exporta).
 *
 * Uso: node scripts/b3-fixture.mjs
 */
import { fileURLToPath } from "node:url";
import writeExcelFile from "write-excel-file/node";

export const B3_MOVEMENTS = [
  ["Entrada/Saída", "Data", "Movimentação", "Produto", "Instituição", "Quantidade", "Preço unitário", "Valor da Operação"],
  ["Credito", "15/01/2025", "Transferência - Liquidação", "PETR4 - PETROLEO BRASILEIRO S.A. PETROBRAS", "XP INVESTIMENTOS CCTVM S/A", 100, 37.2, 3720],
  ["Credito", "20/01/2025", "Transferência - Liquidação", "MXRF11 - MAXI RENDA FUNDO DE INVESTIMENTO IMOBILIARIO", "XP INVESTIMENTOS CCTVM S/A", 300, 9.35, 2805],
  ["Credito", "15/09/2025", "Rendimento", "MXRF11 - MAXI RENDA FUNDO DE INVESTIMENTO IMOBILIARIO", "XP INVESTIMENTOS CCTVM S/A", 300, 0.09, 27],
  ["Debito", "10/11/2025", "Transferência - Liquidação", "PETR4 - PETROLEO BRASILEIRO S.A. PETROBRAS", "XP INVESTIMENTOS CCTVM S/A", 40, 34.5, 1380],
  ["Credito", "19/12/2025", "Juros Sobre Capital Próprio", "ITUB4 - ITAU UNIBANCO HOLDING S.A.", "XP INVESTIMENTOS CCTVM S/A", 80, "-", 36.4],
  ["Credito", "05/01/2026", "Juros", "Tesouro Selic 2029", "XP INVESTIMENTOS CCTVM S/A", 1, "-", 12.3],
];

const cell = (value) => (typeof value === "number" ? { value, type: Number } : { value: String(value), type: String });

export function buildSheet(rows = B3_MOVEMENTS) {
  return writeExcelFile(rows.map((row) => row.map(cell)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const target = fileURLToPath(new URL("../cypress/fixtures/b3-movimentacao.xlsx", import.meta.url));
  await buildSheet().toFile(target);
  console.log(`ok → ${target}`);
}
