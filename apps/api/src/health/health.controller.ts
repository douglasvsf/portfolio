import { Controller, Get } from "@nestjs/common";
import type { HealthResponse } from "@portfolio/shared";

@Controller("health")
export class HealthController {
  @Get()
  check(): HealthResponse {
    return { status: "ok" };
  }
}
