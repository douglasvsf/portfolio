import { Body, CanActivate, Controller, createParamDecorator, ExecutionContext, Get, HttpCode, HttpStatus, Injectable, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import type { Request } from "express";
import { agent } from "@portfolio/shared";
import { ErpException } from "../erp/common/errors";
import { ApiZodBody, ZodPipe } from "../erp/common/zod";
import { SiteAdminGuard } from "../erp/site-admin/site-admin.controller";
import { AgentService } from "./agent.service";

type AgentSessionRow = NonNullable<Awaited<ReturnType<AgentService["authenticate"]>>>;
type RequestWithAgent = Request & { agentSession?: AgentSessionRow };

/** Rotas da conversa: só o token do próprio agente (o do ERP, do Pay ou do painel não valem). */
@Injectable()
export class AgentSessionGuard implements CanActivate {
  constructor(private readonly agentService: AgentService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithAgent>();
    const token = /^Bearer (.+)$/.exec(request.headers.authorization ?? "")?.[1];
    const session = token ? await this.agentService.authenticate(token) : null;
    if (!session) throw new ErpException("unauthorized", "Conversa expirada ou inválida — comece uma nova", HttpStatus.UNAUTHORIZED);
    request.agentSession = session;
    return true;
  }
}

const CurrentAgentSession = createParamDecorator((_: unknown, context: ExecutionContext) => context.switchToHttp().getRequest<RequestWithAgent>().agentSession!);

@ApiTags("Kaiju Agent")
@Controller()
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post("agent/sessions")
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @ApiOperation({ summary: "Começa uma conversa: cria um mercado no ERP e uma loja no Pay para o visitante (24h) e devolve o token" })
  startSession() {
    return this.agentService.startSession();
  }

  @Get("agent/conversation")
  @ApiBearerAuth()
  @UseGuards(AgentSessionGuard)
  @ApiOperation({ summary: "A conversa até aqui, com a linha do tempo de cada turno" })
  conversation(@CurrentAgentSession() session: AgentSessionRow) {
    return this.agentService.conversation(session);
  }

  @Post("agent/messages")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 20, ttl: 600_000 } })
  @ApiBearerAuth()
  @UseGuards(AgentSessionGuard)
  @ApiZodBody(agent.agentMessageSchema)
  @ApiOperation({ summary: "Manda uma mensagem; o agente consulta e age nas APIs (ações que mudam dados esperam confirmação)" })
  send(@CurrentAgentSession() session: AgentSessionRow, @Body(new ZodPipe(agent.agentMessageSchema)) body: agent.AgentMessageInput) {
    return this.agentService.send(session, body.message);
  }

  @Post("agent/turns/:id/confirm")
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 600_000 } })
  @ApiBearerAuth()
  @UseGuards(AgentSessionGuard)
  @ApiZodBody(agent.agentConfirmSchema)
  @ApiOperation({ summary: "Confirma (ou recusa) a ação que o agente deixou esperando" })
  confirm(@CurrentAgentSession() session: AgentSessionRow, @Param("id") id: string, @Body(new ZodPipe(agent.agentConfirmSchema)) body: agent.AgentConfirmInput) {
    return this.agentService.confirm(session, id, body.approve);
  }

  @Get("admin/agent/turns")
  @ApiBearerAuth()
  @UseGuards(SiteAdminGuard)
  @ApiOperation({ summary: "Auditoria: últimos turnos de todas as conversas (painel do site)" })
  recentTurns() {
    return this.agentService.recentTurns();
  }
}
