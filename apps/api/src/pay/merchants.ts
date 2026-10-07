import { CanActivate, createParamDecorator, ExecutionContext, HttpStatus, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash, randomBytes, randomInt } from "node:crypto";
import type { Request } from "express";
import type { pay } from "@portfolio/shared";
import { safeEqual } from "../erp/accounts/password";
import { ErpException } from "../erp/common/errors";
import { PayDatabase } from "./db";
import { assertSafeUrl } from "./safe-http";

/**
 * Lojas de teste (sandboxes) e as chaves de API delas.
 *
 * A chave tem o formato `gz_test_<32 caracteres>`. O banco guarda só o
 * prefixo (para achar a loja) e o SHA-256 da chave inteira — quem lê o banco
 * não consegue usar a chave. Ela aparece uma única vez, na criação.
 */

const SANDBOX_HOURS = 24;
export const API_KEY_PATTERN = /^gz_test_[A-Za-z0-9_-]{32}$/;
const PREFIX_LENGTH = 16;

export interface MerchantRow {
  id: string;
  name: string;
  pix_key: string;
  api_key_prefix: string;
  webhook_secret: string;
  webhook_url: string | null;
  inspector_fail_next: number;
  expires_at: Date;
}

export const toMerchant = (row: MerchantRow): pay.Merchant => ({
  id: row.id,
  name: row.name,
  apiKeyPrefix: row.api_key_prefix,
  pixKey: row.pix_key,
  webhookSecret: row.webhook_secret,
  webhookUrl: row.webhook_url,
  inspectorFailNext: row.inspector_fail_next,
  expiresAt: row.expires_at.toISOString(),
});

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const MERCHANT_COLUMNS = "id, name, pix_key, api_key_prefix, webhook_secret, webhook_url, inspector_fail_next, expires_at";

@Injectable()
export class MerchantsService {
  constructor(
    private readonly db: PayDatabase,
    private readonly config: ConfigService,
  ) {}

  async createSandbox(): Promise<pay.Sandbox> {
    // Limpeza oportunista: lojas vencidas somem (com tudo delas, em cascata) quando nasce uma nova.
    await this.db.query("delete from pay_merchants where id in (select id from pay_merchants where expires_at <= now() limit 100)");
    const { rows } = await this.db.query<{ active: number }>("select count(*)::int as active from pay_merchants");
    if (rows[0]!.active >= Number(this.config.get("PAY_MAX_SANDBOXES") ?? 300)) {
      throw new ErpException("demo_full", "Muitas lojas de teste ativas agora. Tente de novo mais tarde.", HttpStatus.SERVICE_UNAVAILABLE);
    }

    const apiKey = `gz_test_${randomBytes(24).toString("base64url")}`;
    const webhookSecret = `whsec_${randomBytes(24).toString("base64url")}`;
    const { rows: created } = await this.db.query<MerchantRow>(
      `insert into pay_merchants (name, api_key_prefix, api_key_hash, webhook_secret, expires_at)
       values ($1, $2, $3, $4, now() + make_interval(hours => $5))
       returning ${MERCHANT_COLUMNS}`,
      [`Loja Kaiju ${randomInt(1000, 10_000)}`, apiKey.slice(0, PREFIX_LENGTH), sha256(apiKey), webhookSecret, SANDBOX_HOURS],
    );
    const merchant = created[0]!;
    return { id: merchant.id, name: merchant.name, apiKey, webhookSecret, pixKey: merchant.pix_key, expiresAt: merchant.expires_at.toISOString() };
  }

  /** Destino dos webhooks (URL própria ou inspetor) e falhas programadas do inspetor. */
  async updateSettings(merchant: MerchantRow, input: pay.WebhookSettingsInput): Promise<pay.Merchant> {
    if (input.url) {
      try {
        assertSafeUrl(input.url);
      } catch (error) {
        throw new ErpException("validation_error", (error as Error).message, HttpStatus.BAD_REQUEST, { issues: [{ path: "url", message: (error as Error).message }] });
      }
    }
    const { rows } = await this.db.query<MerchantRow>(
      `update pay_merchants set
         webhook_url = case when $2 then $3 else webhook_url end,
         inspector_fail_next = coalesce($4, inspector_fail_next)
       where id = $1 returning ${MERCHANT_COLUMNS}`,
      [merchant.id, input.url !== undefined, input.url ?? null, input.failNext ?? null],
    );
    return toMerchant(rows[0]!);
  }

  /** Loja dona da chave, ou `null` (chave inexistente, errada ou loja vencida). */
  async authenticate(apiKey: string): Promise<MerchantRow | null> {
    if (!API_KEY_PATTERN.test(apiKey)) return null;
    const { rows } = await this.db.query<MerchantRow & { api_key_hash: string }>(
      `select ${MERCHANT_COLUMNS}, api_key_hash from pay_merchants where api_key_prefix = $1 and expires_at > now()`,
      [apiKey.slice(0, PREFIX_LENGTH)],
    );
    const row = rows[0];
    if (!row || !safeEqual(row.api_key_hash, sha256(apiKey))) return null;
    return row;
  }
}

type RequestWithMerchant = Request & { payMerchant?: MerchantRow };

/** Rotas da loja: `Authorization: Bearer gz_test_...`. */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly merchants: MerchantsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithMerchant>();
    const key = /^Bearer (\S+)$/.exec(request.headers.authorization ?? "")?.[1];
    if (!key) throw new ErpException("unauthorized", "Informe a chave de API no cabeçalho Authorization: Bearer gz_test_...", HttpStatus.UNAUTHORIZED);
    const merchant = await this.merchants.authenticate(key);
    if (!merchant) throw new ErpException("unauthorized", "Chave de API inválida ou loja de teste expirada", HttpStatus.UNAUTHORIZED);
    request.payMerchant = merchant;
    return true;
  }
}

export const CurrentMerchant = createParamDecorator((_: unknown, context: ExecutionContext): MerchantRow => {
  const merchant = context.switchToHttp().getRequest<RequestWithMerchant>().payMerchant;
  if (!merchant) throw new ErpException("unauthorized", "Chave de API ausente", HttpStatus.UNAUTHORIZED);
  return merchant;
});
