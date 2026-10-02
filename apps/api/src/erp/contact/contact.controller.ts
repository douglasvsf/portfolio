import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { contact, erp } from "@portfolio/shared";
import { ApiZodBody, ZodPipe } from "../common/zod";
import { SiteAdminGuard } from "../site-admin/site-admin.controller";
import { ContactService } from "./contact.service";

const id = new ZodPipe(erp.objectIdSchema);

/**
 * Formulário de contato do portfólio: envio público (com limite apertado por
 * visitante) e leitura só com o login do painel administrativo do site (/admin).
 */
@ApiTags("Contato")
@Controller()
export class ContactController {
  constructor(private readonly messages: ContactService) {}

  @Post("contact")
  @HttpCode(202)
  @Throttle({ default: { limit: 3, ttl: 3_600_000 } })
  @ApiZodBody(contact.contactMessageSchema)
  @ApiOperation({ summary: "Mensagem do formulário de contato (público; 3 por hora por visitante)" })
  async send(@Body(new ZodPipe(contact.contactMessageSchema)) body: contact.ContactMessageInput) {
    await this.messages.send(body);
    return { received: true };
  }

  @Get("admin/messages")
  @ApiBearerAuth()
  @UseGuards(SiteAdminGuard)
  list() {
    return this.messages.list();
  }

  @Patch("admin/messages/:id")
  @ApiBearerAuth()
  @UseGuards(SiteAdminGuard)
  @ApiZodBody(contact.contactStatusSchema)
  setStatus(@Param("id", id) messageId: string, @Body(new ZodPipe(contact.contactStatusSchema)) body: { status: contact.ContactStatus }) {
    return this.messages.setStatus(messageId, body.status);
  }

  @Delete("admin/messages/:id")
  @HttpCode(204)
  @ApiBearerAuth()
  @UseGuards(SiteAdminGuard)
  remove(@Param("id", id) messageId: string) {
    return this.messages.remove(messageId);
  }
}
