/**
 * Validação de CPF e CNPJ pelos dígitos verificadores (algoritmo oficial da
 * Receita). Aceita com ou sem máscara.
 */

export const onlyDigits = (value: string) => value.replace(/\D/g, "");

function checkDigit(digits: number[], weights: number[]) {
  const sum = digits.reduce((total, digit, index) => total + digit * (weights[index] ?? 0), 0);
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const digits = [...cpf].map(Number);
  const first = checkDigit(digits.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = checkDigit(digits.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return digits[9] === first && digits[10] === second;
}

export function isValidCnpj(value: string): boolean {
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  const digits = [...cnpj].map(Number);
  const first = checkDigit(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = checkDigit(digits.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return digits[12] === first && digits[13] === second;
}

export const isValidDocument = (value: string) => isValidCpf(value) || isValidCnpj(value);

/** "12345678909" → "123.456.789-09"; "11222333000181" → "11.222.333/0001-81". */
export function formatDocument(value: string) {
  const digits = onlyDigits(value);
  if (digits.length === 11) return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  if (digits.length === 14) return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  return value;
}

/** Completa os 2 dígitos verificadores — usado para gerar documentos fictícios válidos na demo. */
export function completeCpf(base9: string) {
  const digits = [...onlyDigits(base9)].map(Number).slice(0, 9);
  const first = checkDigit(digits, [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = checkDigit([...digits, first], [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return [...digits, first, second].join("");
}

export function completeCnpj(base12: string) {
  const digits = [...onlyDigits(base12)].map(Number).slice(0, 12);
  const first = checkDigit(digits, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const second = checkDigit([...digits, first], [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return [...digits, first, second].join("");
}
