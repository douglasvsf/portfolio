import { z } from "zod";
import { objectIdSchema, roleSchema, type Role } from "./common";

/**
 * Contas de verdade (além da demonstração): acesso só por convite.
 *
 * - O dono do sistema é criado uma única vez, com um token de instalação
 *   (ERP_SETUP_TOKEN) que só existe na configuração do servidor.
 * - Administradores convidam pessoas para a empresa deles; o dono convida para
 *   qualquer empresa. O convite é um link de uso único que vale 48 horas.
 * - Sem serviço de e-mail: os links (convite e troca de senha) aparecem na tela
 *   de quem os gerou, para enviar por onde quiser.
 */

export const emailSchema = z
  .email("e-mail inválido")
  .max(120)
  .transform((value) => value.trim().toLowerCase());

/** 10 a 128 caracteres. Frase-senha longa vale mais que símbolo obrigatório. */
export const passwordSchema = z.string().min(10, "a senha precisa de pelo menos 10 caracteres").max(128, "no máximo 128 caracteres");

const personNameSchema = z.string().trim().min(2, "nome muito curto").max(80);
export const companyNameSchema = z.string().trim().min(3, "nome muito curto").max(60);

export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1, "informe a senha").max(128) });
export type LoginInput = z.infer<typeof loginSchema>;

export const setupSchema = z.object({
  token: z.string().min(16).max(200),
  name: personNameSchema,
  email: emailSchema,
  password: passwordSchema,
  companyName: companyNameSchema,
});
export type SetupInput = z.infer<typeof setupSchema>;

export const inviteCreateSchema = z.object({
  email: emailSchema,
  role: roleSchema,
  /** Só o dono escolhe a empresa; o administrador convida para a própria. */
  workspaceId: objectIdSchema.optional(),
});
export type InviteCreateInput = z.infer<typeof inviteCreateSchema>;

export const acceptInviteSchema = z.object({ name: personNameSchema, password: passwordSchema });
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;

export const resetPasswordSchema = z.object({ password: passwordSchema });

export const changePasswordSchema = z
  .object({ current: z.string().min(1, "informe a senha atual").max(128), next: passwordSchema })
  .refine((value) => value.current !== value.next, { path: ["next"], message: "a nova senha precisa ser diferente da atual" });
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const companyCreateSchema = z.object({ name: companyNameSchema });

export const USER_STATUSES = ["active", "blocked"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];
export const USER_STATUS_LABELS: Record<UserStatus, string> = { active: "Ativo", blocked: "Bloqueado" };

export const memberUpdateSchema = z
  .object({ role: roleSchema.optional(), status: z.enum(USER_STATUSES).optional() })
  .refine((value) => value.role !== undefined || value.status !== undefined, "nada para atualizar");
export type MemberUpdate = z.infer<typeof memberUpdateSchema>;

/** Token dos links (convite e troca de senha): 43 caracteres base64url. */
export const linkTokenSchema = z.string().regex(/^[A-Za-z0-9_-]{43}$/, "link inválido");

// ---- Respostas ------------------------------------------------------------------

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  isOwner: boolean;
}

/** Sessão de conta (login): como a da demo, mais o usuário e sem data de fim da empresa. */
export interface AccountSession {
  kind: "account";
  token: string;
  role: Role;
  workspace: { id: string; name: string };
  user: SessionUser;
  /** Quando o token vence (a pessoa entra de novo). */
  expiresAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  isOwner: boolean;
  lastLoginAt?: string;
  createdAt: string;
  /** Visão do dono: a empresa de cada pessoa. */
  workspace?: { id: string; name: string };
}

export interface Invite {
  id: string;
  email: string;
  role: Role;
  expiresAt: string;
  createdAt: string;
  workspace?: { id: string; name: string };
}

/** Convite recém-criado: o token só aparece aqui, uma vez (o banco guarda só o hash). */
export interface CreatedLink {
  token: string;
  expiresAt: string;
}

export interface InvitePreview {
  email: string;
  role: Role;
  workspace: { name: string };
  expiresAt: string;
}

export interface ResetPreview {
  email: string;
  name: string;
  expiresAt: string;
}

export interface Team {
  members: TeamMember[];
  invites: Invite[];
}

export interface Company {
  id: string;
  name: string;
  createdAt: string;
  users: number;
  products: number;
  orders: number;
  revenueCents: number;
}

export interface OwnerOverview {
  companies: number;
  users: number;
  blockedUsers: number;
  pendingInvites: number;
  activeDemos: number;
  demoCapacity: number;
  lastLogins: { name: string; email: string; workspace: string; at: string }[];
}
