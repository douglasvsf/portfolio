import { CanActivate, createParamDecorator, ExecutionContext, HttpStatus, Injectable, SetMetadata } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import type { Request } from "express";
import { Model } from "mongoose";
import type { erp } from "@portfolio/shared";
import { User } from "../schemas";
import { ErpException, forbidden } from "./errors";

/**
 * Sessão do ERP. O `workspaceId` é o isolamento entre empresas — todo acesso
 * ao banco filtra por ele.
 *
 * - Demonstração: o token carrega empresa e papel e vence junto com a demo.
 * - Conta (login): o token carrega também o usuário e uma versão. A cada
 *   requisição o usuário é conferido no banco: bloqueado, senha trocada
 *   (versão nova) ou papel alterado valem na hora, sem esperar o token vencer.
 */
export interface ErpSession {
  workspaceId: string;
  role: erp.Role;
  /** Só em conta de verdade. */
  userId?: string;
  isOwner?: boolean;
}

export interface TokenPayload {
  sub: string;
  role: erp.Role;
  uid?: string;
  ver?: number;
  /** Só os tokens do painel do site têm público; aqui eles não valem. */
  aud?: string;
}

type RequestWithSession = Request & { erpSession?: ErpSession };

const ROLES_KEY = "erp:roles";
const ACCOUNT_KEY = "erp:account";
const OWNER_KEY = "erp:owner";

const expired = () => new ErpException("unauthorized", "Sessão expirada ou inválida — entre de novo", HttpStatus.UNAUTHORIZED);

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
    @InjectModel(User.name) private readonly users: Model<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithSession>();
    const token = /^Bearer (.+)$/.exec(request.headers.authorization ?? "")?.[1];
    if (!token) throw new ErpException("unauthorized", "Sessão ausente — entre de novo", HttpStatus.UNAUTHORIZED);

    let payload: TokenPayload;
    try {
      payload = await this.jwt.verifyAsync<TokenPayload>(token);
    } catch {
      throw expired();
    }

    if (payload.aud) throw expired();

    let session: ErpSession = { workspaceId: payload.sub, role: payload.role };
    if (payload.uid) {
      const user = await this.users.findById(payload.uid).lean();
      if (!user || user.status !== "active" || user.tokenVersion !== payload.ver || user.workspaceId.toString() !== payload.sub) throw expired();
      session = { workspaceId: payload.sub, role: user.role, userId: payload.uid, isOwner: user.isOwner };
    }
    request.erpSession = session;

    const needs = (key: string) => this.reflector.getAllAndOverride<boolean | undefined>(key, [context.getHandler(), context.getClass()]);
    if (needs(ACCOUNT_KEY) && !session.userId) throw new ErpException("forbidden", "Disponível só para contas — a demonstração não tem equipe", HttpStatus.FORBIDDEN);
    if (needs(OWNER_KEY) && !session.isOwner) throw forbidden();

    const roles = this.reflector.getAllAndOverride<erp.Role[] | undefined>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (roles && !roles.includes(session.role)) throw forbidden();
    return true;
  }
}

/** Restringe a rota a papéis específicos (ex.: só admin altera preço). */
export const Roles = (...roles: erp.Role[]) => SetMetadata(ROLES_KEY, roles);

/** Só contas de verdade (equipe, senha). */
export const AccountOnly = () => SetMetadata(ACCOUNT_KEY, true);

/** Só o dono do sistema (painel de todas as empresas). */
export const OwnerOnly = () => SetMetadata(OWNER_KEY, true);

/** Injeta a sessão validada pelo SessionGuard. */
export const Session = createParamDecorator((_: unknown, context: ExecutionContext): ErpSession => {
  const session = context.switchToHttp().getRequest<RequestWithSession>().erpSession;
  if (!session) throw new ErpException("unauthorized", "Sessão ausente", HttpStatus.UNAUTHORIZED);
  return session;
});
