/**
 * Origem real da requisição (protocolo + host que o navegador usou).
 *
 * `request.url` / `nextUrl.origin` não servem aqui: em dev o Next normaliza o
 * host para "localhost" mesmo quando o site foi aberto por 127.0.0.1 — e os
 * cookies do OAuth são por host. Atrás de proxy (Vercel) valem os headers
 * x-forwarded-*.
 */
export function requestOrigin(request: { headers: Headers; nextUrl: URL }) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? request.nextUrl.host;
  const proto = request.headers.get("x-forwarded-proto") ?? request.nextUrl.protocol.replace(/:$/, "");
  return `${proto.split(",")[0].trim()}://${host.split(",")[0].trim()}`;
}
