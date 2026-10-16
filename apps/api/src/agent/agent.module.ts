import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { ErpModule } from "../erp/erp.module";
import { PayModule } from "../pay/pay.module";
import { AgentController, AgentSessionGuard } from "./agent.controller";
import { AgentSessionDoc, AgentSessionSchema, AgentTurnDoc, AgentTurnSchema, AgentUsageDoc, AgentUsageSchema } from "./agent.schemas";
import { AgentService } from "./agent.service";
import { LLM_CLIENT, OpenAiCompatibleClient, UnconfiguredClient } from "./llm";
import { RuleBasedLlm } from "./rule-llm";

/** Kaiju Agent: IA que opera o ERP e o Pay do visitante, com confirmação humana e limites. */
@Module({
  imports: [
    ErpModule,
    PayModule,
    MongooseModule.forFeature([
      { name: AgentSessionDoc.name, schema: AgentSessionSchema },
      { name: AgentTurnDoc.name, schema: AgentTurnSchema },
      { name: AgentUsageDoc.name, schema: AgentUsageSchema },
    ]),
  ],
  controllers: [AgentController],
  providers: [
    AgentService,
    AgentSessionGuard,
    {
      provide: LLM_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        // Cérebro por regras: só no E2E do site, nunca em produção.
        if (config.get("AI_PROVIDER") === "rules" && config.get("NODE_ENV") !== "production" && !config.get("VERCEL")) return new RuleBasedLlm();
        const [baseUrl, apiKey, model] = ["AI_BASE_URL", "AI_API_KEY", "AI_MODEL"].map((name) => config.get<string>(name)?.trim());
        return baseUrl && apiKey && model ? new OpenAiCompatibleClient(baseUrl, apiKey, model) : new UnconfiguredClient();
      },
    },
  ],
})
export class AgentModule {}
