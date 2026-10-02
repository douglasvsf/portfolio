import { z } from "zod";
import { emailSchema, loginSchema, passwordSchema } from "./erp/auth";

/**
 * Painel administrativo do portfólio (/admin). Tem um login só, criado uma
 * única vez; não se mistura com as contas do ERP.
 */

/** Cadastro do login do painel: só enquanto não existir nenhum. */
export const adminSetupSchema = z.object({ email: emailSchema, password: passwordSchema });
export type AdminSetupInput = z.infer<typeof adminSetupSchema>;

export const adminLoginSchema = loginSchema;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

export interface AdminSession {
  token: string;
  name: string;
  email: string;
  expiresAt: string;
}
