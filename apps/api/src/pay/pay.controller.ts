import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Param, Patch, Post, Query, Res, UseGuards } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Response } from "express";
import { z } from "zod";
import { pay } from "@portfolio/shared";
import { safeEqual } from "../erp/accounts/password";
import { ErpException } from "../erp/common/errors";
import { ApiZodBody, ApiZodQuery, ZodPipe } from "../erp/common/zod";
import { ChargesService } from "./charges.service";
import type { IdempotentResult } from "./idempotency";
import { ApiKeyGuard, CurrentMerchant, MerchantsService, toMerchant, type MerchantRow } from "./merchants";
import { WebhooksService } from "./webhooks.service";

const uuid = new ZodPipe(z.uuid({ error: "id inválido" }));
const idempotencyKey = new ZodPipe(pay.idempotencyKeySchema);

/** 201 na primeira vez; a repetição devolve a mesma resposta e avisa no cabeçalho. */
function reply<T>(response: Response, result: IdempotentResult<T>): T {
  response.status(result.statusCode);
  if (result.replayed) response.setHeader("Idempotent-Replayed", "true");
  return result.body;
}

@ApiTags("GODZILLA Pay")
@Controller("pay")
export class PayController {
  constructor(
    private readonly merchants: MerchantsService,
    private readonly charges: ChargesService,
    private readonly webhooks: WebhooksService,
  ) {}

  @Post("sandboxes")
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  @ApiOperation({ summary: "Cria uma loja de teste (24h) e devolve a chave de API — ela aparece só esta vez" })
  createSandbox() {
    return this.merchants.createSandbox();
  }

  @Get("merchant")
  @ApiBearerAuth()
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: "Dados da loja dona da chave" })
  merchant(@CurrentMerchant() merchant: MerchantRow) {
    return toMerchant(merchant);
  }

  @Get("balance")
  @ApiBearerAuth()
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: "Saldo da loja, calculado do livro-caixa" })
  balance(@CurrentMerchant() merchant: MerchantRow) {
    return this.charges.balance(merchant);
  }

  @Post("charges")
  @ApiBearerAuth()
  @UseGuards(ApiKeyGuard)
  @ApiHeader({ name: "Idempotency-Key", required: true, description: "Repetir com a mesma chave devolve a mesma cobrança, sem criar outra" })
  @ApiZodBody(pay.chargeCreateSchema)
  @ApiOperation({ summary: "Cria uma cobrança Pix (devolve o BR Code, o Pix copia e cola)" })
  async createCharge(
    @CurrentMerchant() merchant: MerchantRow,
    @Headers("idempotency-key") key: string | undefined,
    @Body(new ZodPipe(pay.chargeCreateSchema)) body: pay.ChargeCreate,
    @Res({ passthrough: true }) response: Response,
  ) {
    return reply(response, await this.charges.create(merchant, body, idempotencyKey.transform(key)));
  }

  @Get("charges")
  @ApiBearerAuth()
  @UseGuards(ApiKeyGuard)
  @ApiZodQuery(pay.chargeListSchema)
  @ApiOperation({ summary: "Lista as cobranças (mais novas primeiro)" })
  listCharges(@CurrentMerchant() merchant: MerchantRow, @Query(new ZodPipe(pay.chargeListSchema)) query: pay.ChargeListQuery) {
    return this.charges.list(merchant, query);
  }

  @Get("charges/:id")
  @ApiBearerAuth()
  @UseGuards(ApiKeyGuard)
  getCharge(@CurrentMerchant() merchant: MerchantRow, @Param("id", uuid) id: string) {
    return this.charges.get(merchant, id);
  }

  @Post("charges/:id/simulate-payment")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: "Sandbox: simula a confirmação do Pix pelo banco do pagador" })
  async simulatePayment(@CurrentMerchant() merchant: MerchantRow, @Param("id", uuid) id: string) {
    const charge = await this.charges.simulatePayment(merchant, id);
    await this.webhooks.processDue({ merchantId: merchant.id, limit: 5 });
    return charge;
  }

  @Post("charges/:id/refunds")
  @ApiBearerAuth()
  @UseGuards(ApiKeyGuard)
  @ApiHeader({ name: "Idempotency-Key", required: true })
  @ApiZodBody(pay.refundSchema)
  @ApiOperation({ summary: "Estorna a cobrança, por inteiro (sem valor) ou em parte" })
  async refund(
    @CurrentMerchant() merchant: MerchantRow,
    @Param("id", uuid) id: string,
    @Headers("idempotency-key") key: string | undefined,
    @Body(new ZodPipe(pay.refundSchema)) body: pay.RefundInput,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.charges.refund(merchant, id, body, idempotencyKey.transform(key));
    if (!result.replayed) await this.webhooks.processDue({ merchantId: merchant.id, limit: 5 });
    return reply(response, result);
  }

  @Get("ledger")
  @ApiBearerAuth()
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: "Lançamentos do livro-caixa (partidas dobradas) da loja" })
  ledger(@CurrentMerchant() merchant: MerchantRow, @Query("chargeId") chargeId?: string) {
    return this.charges.ledger(merchant, chargeId ? uuid.transform(chargeId) : undefined);
  }

  @Get("webhooks/deliveries")
  @ApiBearerAuth()
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: "Entregas de webhook, com o histórico de tentativas (processa as vencidas antes)" })
  async deliveries(@CurrentMerchant() merchant: MerchantRow) {
    await this.webhooks.processDue({ merchantId: merchant.id, limit: 10 });
    return this.webhooks.list(merchant);
  }

  @Post("webhooks/deliveries/:id/retry")
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: "Reenvia uma entrega agora" })
  retry(@CurrentMerchant() merchant: MerchantRow, @Param("id", uuid) id: string) {
    return this.webhooks.retry(merchant, id);
  }

  @Patch("webhooks/settings")
  @ApiBearerAuth()
  @UseGuards(ApiKeyGuard)
  @ApiZodBody(pay.webhookSettingsSchema)
  @ApiOperation({ summary: "Destino dos webhooks (URL https própria ou null para o inspetor) e falhas programadas do inspetor" })
  settings(@CurrentMerchant() merchant: MerchantRow, @Body(new ZodPipe(pay.webhookSettingsSchema)) body: pay.WebhookSettingsInput) {
    return this.merchants.updateSettings(merchant, body);
  }

  @Get("webhooks/inspector")
  @ApiBearerAuth()
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: "O que o inspetor da loja recebeu (cabeçalhos, corpo e se a assinatura confere)" })
  inspector(@CurrentMerchant() merchant: MerchantRow) {
    return this.webhooks.inspectorRequests(merchant);
  }
}

/**
 * Trabalhador das novas tentativas de webhook, chamado por um agendador
 * (Upstash QStash a cada minuto ou o cron da Vercel) com
 * `Authorization: Bearer <PAY_CRON_SECRET>`. Sem o segredo configurado, fica desligado.
 */
@ApiTags("GODZILLA Pay")
@Controller("pay/internal")
export class PayWorkerController {
  constructor(
    private readonly webhooks: WebhooksService,
    private readonly config: ConfigService,
  ) {}

  private authorize(header: string | undefined) {
    const secret = this.config.get<string>("PAY_CRON_SECRET");
    const sent = /^Bearer (.+)$/.exec(header ?? "")?.[1];
    if (!secret || secret.length < 16 || !sent || !safeEqual(sent, secret)) throw new ErpException("unauthorized", "Não autorizado", HttpStatus.UNAUTHORIZED);
  }

  @Get("webhooks/run")
  @ApiOperation({ summary: "Processa as entregas de webhook vencidas (agendador)" })
  async runGet(@Headers("authorization") authorization?: string) {
    this.authorize(authorization);
    return { processed: await this.webhooks.processDue({ limit: 50 }) };
  }

  @Post("webhooks/run")
  @HttpCode(HttpStatus.OK)
  async runPost(@Headers("authorization") authorization?: string) {
    return this.runGet(authorization);
  }
}
