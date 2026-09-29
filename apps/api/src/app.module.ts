import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { HealthModule } from "./health/health.module";
import { SkillsModule } from "./skills/skills.module";
import { ProjectsModule } from "./projects/projects.module";
import { ExperienceModule } from "./experience/experience.module";
import { ErpModule } from "./erp/erp.module";
import { ClientIpThrottlerGuard } from "./erp/common/throttler";

/**
 * String de conexão do MongoDB. Tolera o erro mais comum ao colar na Vercel
 * (aspas e espaços em volta) e, se ainda assim for inválida, falha com uma
 * mensagem clara no log — sem mostrar a string (ela contém a senha).
 */
export function mongoUri(raw: string | undefined) {
  if (!raw) return "mongodb://127.0.0.1:27017/portfolio";
  const uri = raw
    .trim()
    .replace(/^MONGODB_URI=/, "")
    .replace(/^["']|["']$/g, "")
    .trim();
  if (!/^mongodb(\+srv)?:\/\//.test(uri)) {
    throw new Error("MONGODB_URI inválido: o valor precisa começar com mongodb+srv:// (ou mongodb://). Confira a variável no projeto da Vercel.");
  }
  return uri;
}

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      // Serverless: falha rápido com erro claro em vez de tentar 9 vezes com 3s de intervalo (padrão do Nest).
      useFactory: (config: ConfigService) => ({
        uri: mongoUri(config.get<string>("MONGODB_URI")),
        retryAttempts: 2,
        retryDelay: 1000,
        serverSelectionTimeoutMS: 8000,
      }),
    }),
    HealthModule,
    SkillsModule,
    ProjectsModule,
    ExperienceModule,
    // 120 requisições por minuto por visitante; rotas sensíveis (criar demo) têm limite próprio.
    ThrottlerModule.forRoot([{ name: "default", ttl: 60_000, limit: 120 }]),
    ErpModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ClientIpThrottlerGuard }],
})
export class AppModule {}
