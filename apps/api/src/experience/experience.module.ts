import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { ExperienceItem, ExperienceItemSchema } from "./schemas/experience-item.schema";
import { ExperienceController } from "./experience.controller";
import { ExperienceService } from "./experience.service";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: ExperienceItem.name, schema: ExperienceItemSchema }]),
  ],
  controllers: [ExperienceController],
  providers: [ExperienceService],
})
export class ExperienceModule {}
