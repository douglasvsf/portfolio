import { Controller, Get } from "@nestjs/common";
import type { ExperienceItem } from "@portfolio/shared";
import { ExperienceService } from "./experience.service";

@Controller("experience")
export class ExperienceController {
  constructor(private readonly experienceService: ExperienceService) {}

  @Get()
  findAll(): Promise<ExperienceItem[]> {
    return this.experienceService.findAll();
  }
}
