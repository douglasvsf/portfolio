import { Controller, Get } from "@nestjs/common";
import type { SkillGroup } from "@portfolio/shared";
import { SkillsService } from "./skills.service";

@Controller("skills")
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @Get()
  findAll(): Promise<SkillGroup[]> {
    return this.skillsService.findAll();
  }
}
