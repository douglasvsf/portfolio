import { Injectable } from "@nestjs/common";
import { ThrottlerGuard } from "@nestjs/throttler";
import { timingSafeEqual } from "node:crypto";
import type { Request } from "express";

/**
 * Rate limit por visitante. As telas chamam a API pelo servidor do Next (BFF),
 * então o IP da conexão é o da Vercel — igual para todo mundo. O BFF repassa o
 * IP real em `x-client-ip`, e a API só confia nele se vier com a chave secreta
 * compartilhada (`x-bff-key` = ERP_BFF_KEY). Sem a chave, vale o IP da conexão.
 *
 * No GODZILLA Pay, quem chama com chave de API é contado pela chave (o
 * prefixo, que não é segredo): cada loja tem o seu limite, venha de onde vier.
 */
@Injectable()
export class ClientIpThrottlerGuard extends ThrottlerGuard {
  protected override async getTracker(request: Request): Promise<string> {
    const apiKey = /^Bearer (gz_test_[A-Za-z0-9_-]{8})/.exec(request.header("authorization") ?? "")?.[1];
    if (apiKey) return `api-key:${apiKey}`;
    const key = process.env.ERP_BFF_KEY;
    const sent = request.header("x-bff-key");
    const clientIp = request.header("x-client-ip");
    if (key && sent && clientIp && safeEqual(sent, key)) return `client:${clientIp}`;
    return request.ip ?? "unknown";
  }
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
