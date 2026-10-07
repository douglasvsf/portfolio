import { Module } from "@nestjs/common";
import { ChargesService } from "./charges.service";
import { PayDatabase } from "./db";
import { ApiKeyGuard, MerchantsService } from "./merchants";
import { PayController, PayWorkerController } from "./pay.controller";
import { WebhooksService } from "./webhooks.service";

/** GODZILLA Pay: gateway Pix de demonstração sobre PostgreSQL (independente do Mongo do ERP). */
@Module({
  controllers: [PayController, PayWorkerController],
  providers: [PayDatabase, MerchantsService, ChargesService, WebhooksService, ApiKeyGuard],
})
export class PayModule {}
