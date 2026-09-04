import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { HealthModule } from "./health/health.module";
import { SkillsModule } from "./skills/skills.module";
import { ProjectsModule } from "./projects/projects.module";
import { ExperienceModule } from "./experience/experience.module";

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
  ],
})
export class AppModule {}
