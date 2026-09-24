import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

/**
 * Criptografia simétrica (AES-256-GCM) dos cookies de sessão. Os tokens da
 * Spotify ficam em cookies httpOnly — além disso, cifrados, para que nem o
 * navegador nem quem inspecionar o cookie consiga ler o access/refresh token.
 */

const IV_BYTES = 12;
const TAG_BYTES = 16;

function deriveKey(secret: string) {
  return createHash("sha256").update(`godzilla-spotify-stats:${secret}`).digest();
}

export function encrypt(payload: unknown, secret: string): string {
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", deriveKey(secret), iv);
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64url");
}

/** Retorna `null` para qualquer valor adulterado, truncado ou cifrado com outra chave. */
export function decrypt<T>(value: string | undefined, secret: string): T | null {
  if (!value) return null;
  try {
    const raw = Buffer.from(value, "base64url");
    const iv = raw.subarray(0, IV_BYTES);
    const tag = raw.subarray(IV_BYTES, IV_BYTES + TAG_BYTES);
    const data = raw.subarray(IV_BYTES + TAG_BYTES);
    const decipher = createDecipheriv("aes-256-gcm", deriveKey(secret), iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
    return JSON.parse(decrypted) as T;
  } catch {
    return null;
  }
}

// ---- PKCE (RFC 7636) ------------------------------------------------------

export function randomToken(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

/** code_verifier: 43–128 caracteres do alfabeto "unreserved" — base64url de 64 bytes dá 86. */
export function generateCodeVerifier() {
  return randomToken(64);
}

export function codeChallengeFor(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}
