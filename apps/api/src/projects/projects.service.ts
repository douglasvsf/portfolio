import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import type { Project as ProjectDto } from "@portfolio/shared";
import { Project } from "./schemas/project.schema";

@Injectable()
export class ProjectsService {
  constructor(@InjectModel(Project.name) private readonly projectModel: Model<Project>) {}

  async findAll(): Promise<ProjectDto[]> {
    const docs = await this.projectModel.find().lean().exec();
    return docs.map(({ name, description, tags, link }) => ({ name, description, tags, link }));
  }
}
