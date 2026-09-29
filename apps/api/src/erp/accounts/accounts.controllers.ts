import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { erp } from "@portfolio/shared";
import { AccountOnly, OwnerOnly, Roles, Session, SessionGuard, type ErpSession } from "../common/auth";
import { ApiZodBody, ZodPipe } from "../common/zod";
import { AccountsService } from "./accounts.service";

/**
 * Rotas das contas (acesso por convite):
 * - /erp/auth: instalação, login, convite, troca de senha — públicas, com rate limit apertado;
 * - /erp/team: equipe da empresa (administrador);
 * - /erp/owner: painel do dono do sistema.
 */

const id = new ZodPipe(erp.objectIdSchema);
const linkToken = new ZodPipe(erp.linkTokenSchema);

@ApiTags("Contas")
@Controller("erp/auth")
export class AuthController {
  constructor(private readonly accounts: AccountsService) {}

  @Get("setup")
  @ApiOperation({ summary: "Se a instalação (criar o dono do sistema) ainda está disponível" })
  async setupStatus() {
    return { available: await this.accounts.setupAvailable() };
  }

  @Post("setup")
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  @ApiZodBody(erp.setupSchema)
  @ApiOperation({ summary: "Instalação: cria a empresa e a conta do dono (exige ERP_SETUP_TOKEN; só uma vez)" })
  setup(@Body(new ZodPipe(erp.setupSchema)) body: erp.SetupInput) {
    return this.accounts.setup(body);
  }

  @Post("login")
  @HttpCode(200)
  @Throttle({ default: { limit: 10, ttl: 900_000 } })
  @ApiZodBody(erp.loginSchema)
  @ApiOperation({ summary: "Login (10 tentativas a cada 15 min por IP; 5 senhas erradas seguidas bloqueiam a conta por 15 min)" })
  login(@Body(new ZodPipe(erp.loginSchema)) body: erp.LoginInput) {
    return this.accounts.login(body);
  }

  @Get("invites/:token")
  @Throttle({ default: { limit: 30, ttl: 3_600_000 } })
  previewInvite(@Param("token", linkToken) token: string) {
    return this.accounts.previewInvite(token);
  }

  @Post("invites/:token/accept")
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  @ApiZodBody(erp.acceptInviteSchema)
  @ApiOperation({ summary: "Aceita o convite: cria a conta com a senha escolhida (link de uso único)" })
  acceptInvite(@Param("token", linkToken) token: string, @Body(new ZodPipe(erp.acceptInviteSchema)) body: erp.AcceptInviteInput) {
    return this.accounts.acceptInvite(token, body);
  }

  @Get("resets/:token")
  @Throttle({ default: { limit: 30, ttl: 3_600_000 } })
  previewReset(@Param("token", linkToken) token: string) {
    return this.accounts.previewReset(token);
  }

  @Post("resets/:token")
  @Throttle({ default: { limit: 10, ttl: 3_600_000 } })
  @ApiZodBody(erp.resetPasswordSchema)
  @ApiOperation({ summary: "Define a senha nova pelo link (uso único) e derruba as outras sessões" })
  reset(@Param("token", linkToken) token: string, @Body(new ZodPipe(erp.resetPasswordSchema)) body: { password: string }) {
    return this.accounts.resetPassword(token, body.password);
  }

  @Post("access-requests")
  @HttpCode(202)
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @ApiZodBody(erp.accessRequestSchema)
  @ApiOperation({ summary: "Pedido de acesso (público): vai para o painel do dono. Resposta sempre igual, para não revelar quem tem conta" })
  async requestAccess(@Body(new ZodPipe(erp.accessRequestSchema)) body: erp.AccessRequestInput) {
    await this.accounts.requestAccess(body);
    return { received: true };
  }

  @Post("password")
  @HttpCode(200)
  @ApiBearerAuth()
  @UseGuards(SessionGuard)
  @AccountOnly()
  @ApiZodBody(erp.changePasswordSchema)
  @ApiOperation({ summary: "Troca a própria senha (derruba as outras sessões)" })
  changePassword(@Session() session: ErpSession, @Body(new ZodPipe(erp.changePasswordSchema)) body: erp.ChangePasswordInput) {
    return this.accounts.changePassword(session, body);
  }
}

@ApiTags("Equipe")
@ApiBearerAuth()
@UseGuards(SessionGuard)
@AccountOnly()
@Roles("admin")
@Controller("erp/team")
export class TeamController {
  constructor(private readonly accounts: AccountsService) {}

  @Get()
  team(@Session() session: ErpSession) {
    return this.accounts.team(session);
  }

  @Post("invites")
  @ApiZodBody(erp.inviteCreateSchema)
  @ApiOperation({ summary: "Convida para a empresa: devolve o link (48h) uma única vez" })
  invite(@Session() session: ErpSession, @Body(new ZodPipe(erp.inviteCreateSchema)) body: erp.InviteCreateInput) {
    return this.accounts.createInvite(session, { email: body.email, role: body.role });
  }

  @Delete("invites/:id")
  @HttpCode(204)
  revokeInvite(@Session() session: ErpSession, @Param("id", id) inviteId: string) {
    return this.accounts.revokeInvite({ ...session, isOwner: false }, inviteId);
  }

  @Patch("members/:id")
  @ApiZodBody(erp.memberUpdateSchema)
  @ApiOperation({ summary: "Troca o papel ou bloqueia/desbloqueia (bloquear derruba as sessões na hora)" })
  update(@Session() session: ErpSession, @Param("id", id) userId: string, @Body(new ZodPipe(erp.memberUpdateSchema)) body: erp.MemberUpdate) {
    return this.accounts.updateMember({ ...session, isOwner: false }, userId, body);
  }

  @Post("members/:id/reset")
  @ApiOperation({ summary: "Gera um link de troca de senha (24h, uso único) para enviar à pessoa" })
  reset(@Session() session: ErpSession, @Param("id", id) userId: string) {
    return this.accounts.createResetLink({ ...session, isOwner: false }, userId);
  }
}

@ApiTags("Dono do sistema")
@ApiBearerAuth()
@UseGuards(SessionGuard)
@AccountOnly()
@OwnerOnly()
@Controller("erp/owner")
export class OwnerController {
  constructor(private readonly accounts: AccountsService) {}

  @Get("overview")
  overview() {
    return this.accounts.overview();
  }

  @Get("companies")
  companies() {
    return this.accounts.companies();
  }

  @Post("companies")
  @ApiZodBody(erp.companyCreateSchema)
  createCompany(@Body(new ZodPipe(erp.companyCreateSchema)) body: { name: string }) {
    return this.accounts.createCompany(body.name);
  }

  @Get("access-requests")
  accessRequests() {
    return this.accounts.accessRequests();
  }

  @Post("access-requests/:id/approve")
  @ApiZodBody(erp.accessApproveSchema)
  @ApiOperation({ summary: "Aprova o pedido: gera o convite (na empresa escolhida ou numa nova) e devolve o link" })
  approve(@Session() session: ErpSession, @Param("id", id) requestId: string, @Body(new ZodPipe(erp.accessApproveSchema)) body: erp.AccessApproveInput) {
    return this.accounts.approveRequest(session, requestId, body);
  }

  @Post("access-requests/:id/reject")
  @HttpCode(204)
  reject(@Param("id", id) requestId: string) {
    return this.accounts.rejectRequest(requestId);
  }

  @Get("users")
  users() {
    return this.accounts.allUsers();
  }

  @Get("invites")
  invites() {
    return this.accounts.allInvites();
  }

  @Post("invites")
  @ApiZodBody(erp.inviteCreateSchema)
  @ApiOperation({ summary: "Convida para qualquer empresa (workspaceId)" })
  invite(@Session() session: ErpSession, @Body(new ZodPipe(erp.inviteCreateSchema)) body: erp.InviteCreateInput) {
    return this.accounts.createInvite(session, body);
  }

  @Delete("invites/:id")
  @HttpCode(204)
  revokeInvite(@Session() session: ErpSession, @Param("id", id) inviteId: string) {
    return this.accounts.revokeInvite(session, inviteId);
  }

  @Patch("users/:id")
  @ApiZodBody(erp.memberUpdateSchema)
  update(@Session() session: ErpSession, @Param("id", id) userId: string, @Body(new ZodPipe(erp.memberUpdateSchema)) body: erp.MemberUpdate) {
    return this.accounts.updateMember(session, userId, body);
  }

  @Post("users/:id/reset")
  reset(@Session() session: ErpSession, @Param("id", id) userId: string) {
    return this.accounts.createResetLink(session, userId);
  }
}
