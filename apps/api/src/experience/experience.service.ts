import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import type { ExperienceItem as ExperienceItemDto } from "@portfolio/shared";
import { ExperienceItem } from "./schemas/experience-item.schema";

@Injectable()
export class ExperienceService {
  constructor(
    @InjectModel(ExperienceItem.name) private readonly experienceItemModel: Model<ExperienceItem>,
  ) {}

  async findAll(): Promise<ExperienceItemDto[]> {
    const docs = await this.experienceItemModel.find().lean().exec();
    return docs.map(({ role, company, period, description }) => ({
      role,
      company,
      period,
      description,
    }));
  }
}
