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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>("MONGODB_URI") ?? "mongodb://127.0.0.1:27017/portfolio",
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
