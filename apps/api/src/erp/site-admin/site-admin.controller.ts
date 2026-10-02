import { Body, CanActivate, Controller, ExecutionContext, Get, HttpCode, HttpStatus, Injectable, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { admin } from "@portfolio/shared";
import { AccountOnly, OwnerOnly, Session, SessionGuard, type ErpSession } from "../common/auth";
import { ErpException } from "../common/errors";
import { ApiZodBody, ZodPipe } from "../common/zod";
import { SiteAdminService } from "./site-admin.service";

/** Protege as rotas do painel do site: só o token do login do painel passa (o do ERP, não). */
@Injectable()
export class SiteAdminGuard implements CanActivate {
  constructor(private readonly admins: SiteAdminService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const token = /^Bearer (.+)$/.exec(context.switchToHttp().getRequest<Request>().headers.authorization ?? "")?.[1];
    if (!token || !(await this.admins.verify(token))) throw new ErpException("unauthorized", "Sessão expirada ou inválida — entre de novo", HttpStatus.UNAUTHORIZED);
    return true;
  }
}

@ApiTags("Painel do site")
@Controller("admin/auth")
export class SiteAdminController {
  constructor(private readonly admins: SiteAdminService) {}

  @Get("setup")
  @ApiOperation({ summary: "Se o cadastro do login do painel ainda está disponível" })
  async setupStatus() {
    return { available: await this.admins.setupAvailable() };
  }

  @Post("setup")
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  @ApiBearerAuth()
  @UseGuards(SessionGuard)
  @AccountOnly()
  @OwnerOnly()
  @ApiZodBody(admin.adminSetupSchema)
  @ApiOperation({ summary: "Cria o login do painel do site (só o dono do sistema; só uma vez)" })
  setup(@Session() session: ErpSession, @Body(new ZodPipe(admin.adminSetupSchema)) body: admin.AdminSetupInput) {
    return this.admins.setup(session.userId!, body);
  }

  @Post("login")
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 900_000 } })
  @ApiZodBody(admin.adminLoginSchema)
  @ApiOperation({ summary: "Login do painel (10 tentativas a cada 15 min por IP; 5 senhas erradas seguidas bloqueiam por 15 min)" })
  login(@Body(new ZodPipe(admin.adminLoginSchema)) body: admin.AdminLoginInput) {
    return this.admins.login(body);
  }
}
