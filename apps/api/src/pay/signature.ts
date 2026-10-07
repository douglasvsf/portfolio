import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Assinatura dos webhooks (no estilo do Stripe): o cabeçalho
 * `Godzilla-Signature: t=<unix>,v1=<hmac>` carrega o horário e o HMAC-SHA256
 * de "<t>.<corpo>" com o segredo da loja. Quem recebe recalcula o HMAC e
 * recusa assinatura errada ou velha demais (protege contra reenvio).
 */

export const SIGNATURE_HEADER = "godzilla-signature";
const TOLERANCE_SECONDS = 5 * 60;

const hmac = (secret: string, timestamp: number, body: string) => createHmac("sha256", secret).update(`${timestamp}.${body}`).digest("hex");

export function signPayload(secret: string, body: string, timestamp = Math.floor(Date.now() / 1000)) {
  return `t=${timestamp},v1=${hmac(secret, timestamp, body)}`;
}

/** O que um servidor que recebe o webhook deve fazer. Também é o que o inspetor da loja faz. */
export function verifySignature(secret: string, body: string, header: string | undefined, now = Math.floor(Date.now() / 1000)): boolean {
  const parts = Object.fromEntries((header ?? "").split(",").map((part) => part.split("=", 2) as [string, string]));
  const timestamp = Number(parts.t);
  if (!Number.isInteger(timestamp) || !parts.v1 || Math.abs(now - timestamp) > TOLERANCE_SECONDS) return false;
  const expected = Buffer.from(hmac(secret, timestamp, body));
  const received = Buffer.from(parts.v1);
  return expected.length === received.length && timingSafeEqual(expected, received);
}
