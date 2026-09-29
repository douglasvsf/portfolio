import { createHash, randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";

/**
 * Senhas com scrypt (nativo do Node): função lenta e que usa muita memória de
 * propósito, para que testar senhas em massa custe caro. Parâmetros da
 * recomendação da OWASP (N=2^17, r=8, p=1). O formato guarda os parâmetros,
 * então dá para endurecer depois sem invalidar as senhas antigas:
 *
 *   scrypt$<N>$<r>$<p>$<sal base64>$<hash base64>
 */

const PARAMS = { N: 2 ** 17, r: 8, p: 1 } as const;
const KEY_LENGTH = 32;

function derive(password: string, salt: Buffer, options: { N: number; r: number; p: number }) {
  const scryptOptions: ScryptOptions = { ...options, maxmem: 256 * 1024 * 1024 };
  return new Promise<Buffer>((resolve, reject) => scrypt(password.normalize("NFKC"), salt, KEY_LENGTH, scryptOptions, (error, key) => (error ? reject(error) : resolve(key))));
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derive(password, salt, PARAMS);
  return ["scrypt", PARAMS.N, PARAMS.r, PARAMS.p, salt.toString("base64"), key.toString("base64")].join("$");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [scheme, n, r, p, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const key = await derive(password, Buffer.from(salt, "base64"), { N: Number(n), r: Number(r), p: Number(p) });
  return key.length === expected.length && timingSafeEqual(key, expected);
}

let dummy: Promise<string> | undefined;
/**
 * Quando o e-mail não existe, a API confere a senha contra um hash qualquer
 * mesmo assim: a resposta demora o mesmo tempo e não revela quem tem conta.
 */
export const dummyHash = () => (dummy ??= hashPassword("senha-que-ninguem-tem"));

/** Token dos links de convite e de troca de senha: 256 bits aleatórios, base64url (43 caracteres). */
export const newLinkToken = () => randomBytes(32).toString("base64url");

/** O banco guarda só o hash do token: quem lê o banco não consegue usar o link. */
export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
