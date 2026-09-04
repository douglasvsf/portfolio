import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import type { SkillGroup as SkillGroupDto } from "@portfolio/shared";
import { SkillGroup } from "./schemas/skill-group.schema";

@Injectable()
export class SkillsService {
  constructor(@InjectModel(SkillGroup.name) private readonly skillGroupModel: Model<SkillGroup>) {}

  async findAll(): Promise<SkillGroupDto[]> {
    const docs = await this.skillGroupModel.find().lean().exec();
    return docs.map(({ category, items }) => ({ category, items }));
  }
}
