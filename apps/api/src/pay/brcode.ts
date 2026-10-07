/**
 * BR Code do Pix ("copia e cola"), no padrão EMV QRCPS-MPM do Manual de
 * Padrões para Iniciação do Pix (Banco Central). O texto é uma sequência de
 * campos TLV — ID (2 dígitos) + tamanho (2 dígitos) + valor — fechada por um
 * CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF) sobre tudo o que vem
 * antes, inclusive o "6304" do próprio campo do CRC.
 */

const tlv = (id: string, value: string) => {
  if (value.length > 99) throw new Error(`campo ${id} do BR Code passa de 99 caracteres`);
  return `${id}${String(value.length).padStart(2, "0")}${value}`;
};

/** CRC16-CCITT-FALSE, em 4 dígitos hexadecimais maiúsculos. */
export function crc16(payload: string): string {
  let crc = 0xffff;
  for (const byte of Buffer.from(payload, "utf8")) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/** Nome e cidade do recebedor: só ASCII maiúsculo, sem acento, no tamanho do padrão. */
const plain = (value: string, max: number) =>
  value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase()
    .slice(0, max);

export interface BrCodeInput {
  pixKey: string;
  amountCents: number;
  merchantName: string;
  merchantCity: string;
  /** Identificador da transação: até 25 letras e números. */
  txid: string;
  description?: string | null;
}

export function buildBrCode({ pixKey, amountCents, merchantName, merchantCity, txid, description }: BrCodeInput): string {
  if (!/^[A-Za-z0-9]{1,25}$/.test(txid)) throw new Error("txid inválido para o BR Code");
  // Chave + descrição precisam caber nos 99 caracteres do campo 26.
  const head = tlv("00", "br.gov.bcb.pix") + tlv("01", pixKey);
  const info = description ? plain(description, 99 - head.length - 4) : "";
  const account = head + (info ? tlv("02", info) : "");
  const payload =
    tlv("00", "01") + // versão do payload
    tlv("01", "12") + // QR de uso único
    tlv("26", account) +
    tlv("52", "0000") + // categoria do recebedor (não informada)
    tlv("53", "986") + // real (ISO 4217)
    tlv("54", (amountCents / 100).toFixed(2)) +
    tlv("58", "BR") +
    tlv("59", plain(merchantName, 25) || "GODZILLA PAY") +
    tlv("60", plain(merchantCity, 15) || "SAO PAULO") +
    tlv("62", tlv("05", txid)) +
    "6304";
  return payload + crc16(payload);
}

/** Lê um BR Code (campos de primeiro nível) e confere o CRC. Usado nos testes e no diagnóstico. */
export function parseBrCode(code: string): { fields: Record<string, string>; crcValid: boolean } {
  const fields: Record<string, string> = {};
  let position = 0;
  while (position < code.length) {
    const id = code.slice(position, position + 2);
    const size = Number(code.slice(position + 2, position + 4));
    if (!/^\d{2}$/.test(id) || !Number.isInteger(size)) throw new Error("BR Code malformado");
    fields[id] = code.slice(position + 4, position + 4 + size);
    position += 4 + size;
  }
  const crcValid = code.length > 4 && crc16(code.slice(0, -4)) === code.slice(-4);
  return { fields, crcValid };
}
