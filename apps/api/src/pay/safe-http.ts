import { lookup as dnsLookup, type LookupAddress } from "node:dns";
import { request } from "node:https";
import { BlockList, isIP } from "node:net";

/**
 * Envio de webhook para uma URL escolhida pelo visitante — a porta clássica de
 * SSRF (fazer o servidor acessar a rede interna ou o endereço de metadados da
 * nuvem, 169.254.169.254). Regras:
 *
 * - só HTTPS na porta 443, sem usuário/senha na URL e sem seguir redirecionamento;
 * - o IP é conferido DEPOIS da resolução de DNS, no próprio `lookup` usado na
 *   conexão: um domínio que resolve para IP interno (inclusive por "DNS
 *   rebinding", trocando o IP entre a checagem e a conexão) é recusado;
 * - tempo máximo curto e a resposta é descartada.
 */

const blocked = new BlockList();
for (const [network, prefix] of [
  ["0.0.0.0", 8], // "esta rede"
  ["10.0.0.0", 8], // privada
  ["100.64.0.0", 10], // CGNAT
  ["127.0.0.0", 8], // loopback
  ["169.254.0.0", 16], // link-local (metadados da nuvem)
  ["172.16.0.0", 12], // privada
  ["192.0.0.0", 24], // protocolos IETF
  ["192.0.2.0", 24], // documentação
  ["192.168.0.0", 16], // privada
  ["198.18.0.0", 15], // testes de desempenho
  ["198.51.100.0", 24], // documentação
  ["203.0.113.0", 24], // documentação
  ["224.0.0.0", 4], // multicast
  ["240.0.0.0", 4], // reservada + broadcast
] as const)
  blocked.addSubnet(network, prefix, "ipv4");
for (const [network, prefix] of [
  ["::", 128], // não especificado
  ["::1", 128], // loopback
  // IPv4 mapeado (::ffff:a.b.c.d) NÃO entra aqui: o BlockList confere todo IPv4 também nessa forma,
  // e bloquear a faixa recusaria qualquer IPv4. Ele é desembrulhado e conferido como IPv4 em isPublicAddress.
  ["64:ff9b::", 96], // tradução NAT64
  ["100::", 64], // descarte
  ["2001:db8::", 32], // documentação
  ["fc00::", 7], // privada (ULA)
  ["fe80::", 10], // link-local
  ["ff00::", 8], // multicast
] as const)
  blocked.addSubnet(network, prefix, "ipv6");

export function isPublicAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return !blocked.check(address, "ipv4");
  if (family !== 6) return false;
  const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/i.exec(address);
  if (mapped) return isPublicAddress(mapped[1]!);
  return !blocked.check(address, "ipv6");
}

export class UnsafeUrlError extends Error {}

/** Confere a URL antes de salvar e antes de cada envio. */
export function assertSafeUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new UnsafeUrlError("URL inválida");
  }
  if (url.protocol !== "https:") throw new UnsafeUrlError("use uma URL https://");
  if (url.port && url.port !== "443") throw new UnsafeUrlError("só a porta 443 é aceita");
  if (url.username || url.password) throw new UnsafeUrlError("a URL não pode ter usuário ou senha");
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (isIP(host) && !isPublicAddress(host)) throw new UnsafeUrlError("endereço interno não é aceito");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) throw new UnsafeUrlError("endereço interno não é aceito");
  return url;
}

type LookupCallback = (error: NodeJS.ErrnoException | null, address: string | LookupAddress[], family?: number) => void;

/** `lookup` da conexão: só devolve o endereço se TODOS os IPs do domínio forem públicos. */
export function safeLookup(hostname: string, options: object, callback: LookupCallback) {
  dnsLookup(hostname, { ...options, all: true }, (error, addresses) => {
    if (error) return callback(error, "");
    const list = addresses as LookupAddress[];
    if (list.length === 0 || list.some((entry) => !isPublicAddress(entry.address))) {
      return callback(Object.assign(new Error("o domínio aponta para um endereço interno"), { code: "EUNSAFEADDR" }), "");
    }
    const all = (options as { all?: boolean }).all;
    return all ? callback(null, list) : callback(null, list[0]!.address, list[0]!.family);
  });
}

export interface PostResult {
  statusCode: number | null;
  error: string | null;
  durationMs: number;
}

export function safePost(rawUrl: string, body: string, headers: Record<string, string>, timeoutMs = 5000): Promise<PostResult> {
  const started = Date.now();
  const done = (statusCode: number | null, error: string | null): PostResult => ({ statusCode, error, durationMs: Date.now() - started });
  let url: URL;
  try {
    url = assertSafeUrl(rawUrl);
  } catch (error) {
    return Promise.resolve(done(null, (error as Error).message));
  }
  return new Promise((resolve) => {
    const req = request(
      url,
      { method: "POST", headers: { ...headers, "content-length": String(Buffer.byteLength(body)) }, lookup: safeLookup as never, timeout: timeoutMs },
      (res) => {
        res.resume(); // a resposta não interessa: só o código
        res.on("end", () => resolve(done(res.statusCode ?? null, null)));
        res.on("error", () => resolve(done(res.statusCode ?? null, null)));
      },
    );
    req.on("timeout", () => req.destroy(new Error(`sem resposta em ${timeoutMs / 1000}s`)));
    req.on("error", (error) => resolve(done(null, error.message)));
    req.end(body);
  });
}
