import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { contact, erp } from "@portfolio/shared";
import { AccountOnly, OwnerOnly, SessionGuard } from "../common/auth";
import { ApiZodBody, ZodPipe } from "../common/zod";
import { ContactService } from "./contact.service";

const id = new ZodPipe(erp.objectIdSchema);

/**
 * Formulário de contato do portfólio: envio público (com limite apertado por
 * visitante) e leitura só pelo dono do sistema, no painel.
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

  @Get("erp/owner/messages")
  @ApiBearerAuth()
  @UseGuards(SessionGuard)
  @AccountOnly()
  @OwnerOnly()
  list() {
    return this.messages.list();
  }

  @Patch("erp/owner/messages/:id")
  @ApiBearerAuth()
  @UseGuards(SessionGuard)
  @AccountOnly()
  @OwnerOnly()
  @ApiZodBody(contact.contactStatusSchema)
  setStatus(@Param("id", id) messageId: string, @Body(new ZodPipe(contact.contactStatusSchema)) body: { status: contact.ContactStatus }) {
    return this.messages.setStatus(messageId, body.status);
  }

  @Delete("erp/owner/messages/:id")
  @HttpCode(204)
  @ApiBearerAuth()
  @UseGuards(SessionGuard)
  @AccountOnly()
  @OwnerOnly()
  remove(@Param("id", id) messageId: string) {
    return this.messages.remove(messageId);
  }
}
