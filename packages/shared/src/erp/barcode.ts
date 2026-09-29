/**
 * Códigos de barras do mercado.
 *
 * - Produto embalado (un, L): EAN-13 ou EAN-8, com dígito verificador.
 * - Produto pesado (kg): código de balança (PLU) de 5 dígitos. A balança
 *   imprime uma etiqueta EAN-13 que começa com "2" (faixa reservada para uso
 *   interno da loja): 2 + PLU (5) + peso em gramas (6) + dígito verificador.
 *
 * O PDV lê também o multiplicador dos caixas: "3*7891234567895" = 3 unidades.
 */

const onlyDigits = (value: string) => value.replace(/\D/g, "");

/** Dígito verificador EAN (pesos 3 e 1 a partir da direita). */
export function eanCheckDigit(body: string): number {
  const sum = [...body].reverse().reduce((total, digit, index) => total + Number(digit) * (index % 2 === 0 ? 3 : 1), 0);
  return (10 - (sum % 10)) % 10;
}

export function isValidEan(code: string): boolean {
  if (!/^(\d{8}|\d{13})$/.test(code)) return false;
  return eanCheckDigit(code.slice(0, -1)) === Number(code.at(-1));
}

export const isPlu = (code: string) => /^\d{5}$/.test(code);

/** Faixa "2" do EAN-13: etiquetas geradas dentro da loja (balança). */
export const isInStoreEan = (code: string) => code.length === 13 && code.startsWith("2");

/** Etiqueta da balança: 2 + PLU + gramas + DV. Até 999,999 kg. */
export function buildScaleLabel(plu: string, grams: number): string {
  const body = `2${plu}${String(Math.round(grams)).padStart(6, "0")}`;
  return `${body}${eanCheckDigit(body)}`;
}

/** Completa um EAN a partir do corpo (12 ou 7 dígitos). */
export const completeEan = (body: string) => `${body}${eanCheckDigit(body)}`;

export type ScanResult =
  | { kind: "ean"; code: string; multiplier: number }
  | { kind: "scale"; plu: string; grams: number; multiplier: 1 }
  | { kind: "text"; text: string; multiplier: number };

/** Interpreta o que chegou do leitor (ou foi digitado) no campo do PDV. */
export function parseScanInput(raw: string): ScanResult | null {
  const input = raw.trim();
  if (!input) return null;

  const match = /^(\d{1,3})\s*[*xX]\s*(.+)$/.exec(input);
  const multiplier = match ? Math.max(1, Number(match[1])) : 1;
  const rest = (match ? match[2]! : input).trim();

  if (/^\d+$/.test(rest)) {
    const code = onlyDigits(rest);
    if (isValidEan(code) && isInStoreEan(code) && !match) {
      return { kind: "scale", plu: code.slice(1, 6), grams: Number(code.slice(6, 12)), multiplier: 1 };
    }
    if (isValidEan(code)) return { kind: "ean", code, multiplier };
    if (isPlu(code)) return { kind: "ean", code, multiplier };
  }
  return { kind: "text", text: rest, multiplier };
}
