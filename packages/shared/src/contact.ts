import { z } from "zod";

/**
 * Formulário de contato do portfólio (vagas e freelances). O mesmo schema
 * valida o formulário no site e a requisição na API. As mensagens ficam no
 * banco e aparecem no painel do dono.
 */

export const CONTACT_KINDS = ["job", "freelance", "other"] as const;
export type ContactKind = (typeof CONTACT_KINDS)[number];

export const CONTACT_LIMITS = { name: 80, email: 120, company: 80, message: 2000, minMessage: 20 } as const;

export const contactMessageSchema = z.object({
  kind: z.enum(CONTACT_KINDS),
  name: z.string().trim().min(2).max(CONTACT_LIMITS.name),
  email: z
    .email()
    .max(CONTACT_LIMITS.email)
    .transform((value) => value.trim().toLowerCase()),
  company: z.string().trim().max(CONTACT_LIMITS.company).optional(),
  message: z.string().trim().min(CONTACT_LIMITS.minMessage).max(CONTACT_LIMITS.message),
  /** Idioma em que a pessoa estava lendo o site: ajuda a responder no mesmo idioma. */
  locale: z.enum(["pt-BR", "en-US", "es-ES"]).optional(),
  /** Armadilha para robôs: invisível na tela; gente de verdade não preenche. */
  website: z.string().max(200).optional(),
});
export type ContactMessageInput = z.infer<typeof contactMessageSchema>;

export const CONTACT_STATUSES = ["new", "read"] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];
export const contactStatusSchema = z.object({ status: z.enum(CONTACT_STATUSES) });

export interface ContactMessage {
  id: string;
  kind: ContactKind;
  name: string;
  email: string;
  company?: string;
  message: string;
  locale?: string;
  status: ContactStatus;
  createdAt: string;
}
