import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import type { contact } from "@portfolio/shared";
import { ErpException, notFound } from "../common/errors";
import { ContactMessage } from "../schemas";

/** Teto de mensagens guardadas: protege o banco gratuito de enxurrada de robô. */
const MAX_MESSAGES = 500;
/** Mensagem some sozinha depois de um ano (TTL): dado pessoal não fica guardado para sempre. */
const RETENTION_MS = 365 * 24 * 3_600_000;
const NOTIFY_TIMEOUT_MS = 5_000;

const KIND_LABELS: Record<contact.ContactKind, string> = { job: "Vaga", freelance: "Freelance", other: "Outro" };

/**
 * Mensagens do formulário de contato do portfólio. Ficam no banco (aparecem no
 * painel do dono) — nada depende de serviço externo para não se perder.
 *
 * Aviso por e-mail é opcional: com RESEND_API_KEY e CONTACT_NOTIFY_EMAIL
 * configurados, cada mensagem nova dispara um e-mail para o dono, com
 * "responder para" apontando para quem escreveu. Se o aviso falhar, a mensagem
 * continua salva.
 */
@Injectable()
export class ContactService {
  private readonly logger = new Logger("Contact");

  constructor(
    @InjectModel(ContactMessage.name) private readonly messages: Model<ContactMessage>,
    private readonly config: ConfigService,
  ) {}

  /** A resposta é sempre a mesma; robô que preenche a armadilha (`website`) é ignorado em silêncio. */
  async send(input: contact.ContactMessageInput): Promise<void> {
    if (input.website) return;
    if ((await this.messages.estimatedDocumentCount()) >= MAX_MESSAGES) {
      throw new ErpException("rate_limited", "Muitas mensagens no momento. Tente de novo mais tarde ou escreva por e-mail.", HttpStatus.SERVICE_UNAVAILABLE);
    }
    const message = await this.messages.create({
      kind: input.kind,
      name: input.name,
      email: input.email,
      company: input.company || undefined,
      message: input.message,
      locale: input.locale,
      expiresAt: new Date(Date.now() + RETENTION_MS),
    });
    await this.notify(this.toMessage(message.toObject()));
  }

  async list(): Promise<contact.ContactMessage[]> {
    const list = await this.messages.find().sort({ createdAt: -1 }).limit(200).lean();
    return list.map((message) => this.toMessage(message));
  }

  unread(): Promise<number> {
    return this.messages.countDocuments({ status: "new" });
  }

  async setStatus(id: string, status: contact.ContactStatus): Promise<contact.ContactMessage> {
    const message = await this.messages.findByIdAndUpdate(id, { $set: { status } }, { returnDocument: "after" }).lean();
    if (!message) throw notFound("Mensagem");
    return this.toMessage(message);
  }

  async remove(id: string): Promise<void> {
    const result = await this.messages.deleteOne({ _id: id });
    if (result.deletedCount === 0) throw notFound("Mensagem");
  }

  /** E-mail de aviso pelo Resend (API HTTP, sem SDK). Nunca derruba o envio da mensagem. */
  private async notify(message: contact.ContactMessage) {
    const key = this.config.get<string>("RESEND_API_KEY");
    const to = this.config.get<string>("CONTACT_NOTIFY_EMAIL");
    if (!key || !to) return;
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        signal: AbortSignal.timeout(NOTIFY_TIMEOUT_MS),
        headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
        body: JSON.stringify({
          from: this.config.get<string>("CONTACT_NOTIFY_FROM") ?? "GODZILLA.DEV <onboarding@resend.dev>",
          to: [to],
          reply_to: message.email,
          subject: `[${KIND_LABELS[message.kind]}] ${message.name}${message.company ? ` — ${message.company}` : ""}`,
          text: `${message.name} <${message.email}>${message.company ? `\n${message.company}` : ""}\n\n${message.message}\n\n— enviado pelo formulário do portfólio (${message.locale ?? "idioma não informado"})`,
        }),
      });
      if (!response.ok) this.logger.warn(`Aviso por e-mail recusado: ${response.status}`);
    } catch (error) {
      this.logger.warn(`Aviso por e-mail falhou: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private toMessage(doc: ContactMessage & { _id: Types.ObjectId }): contact.ContactMessage {
    return {
      id: doc._id.toString(),
      kind: doc.kind,
      name: doc.name,
      email: doc.email,
      ...(doc.company ? { company: doc.company } : {}),
      message: doc.message,
      ...(doc.locale ? { locale: doc.locale } : {}),
      status: doc.status,
      createdAt: (doc.createdAt ?? new Date(0)).toISOString(),
    };
  }
}
