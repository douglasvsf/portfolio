import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { SkillGroup, SkillGroupSchema } from "./schemas/skill-group.schema";
import { SkillsController } from "./skills.controller";
import { SkillsService } from "./skills.service";

@Module({
  imports: [MongooseModule.forFeature([{ name: SkillGroup.name, schema: SkillGroupSchema }])],
  controllers: [SkillsController],
  providers: [SkillsService],
})
export class SkillsModule {}
