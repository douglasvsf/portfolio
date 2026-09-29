import { CanActivate, createParamDecorator, ExecutionContext, HttpStatus, Injectable, SetMetadata } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import type { erp } from "@portfolio/shared";
import { ErpException, forbidden } from "./errors";

/**
 * Sessão do ERP: um JWT por empresa demo. O `workspaceId` do token é o
 * isolamento entre tenants — todo acesso ao banco filtra por ele.
 */
export interface ErpSession {
  workspaceId: string;
  role: erp.Role;
}

interface TokenPayload {
  sub: string;
  role: erp.Role;
}

type RequestWithSession = Request & { erpSession?: ErpSession };

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<RequestWithSession>();
    const token = /^Bearer (.+)$/.exec(request.headers.authorization ?? "")?.[1];
    if (!token) throw new ErpException("unauthorized", "Sessão ausente — entre na demonstração", HttpStatus.UNAUTHORIZED);

    let payload: TokenPayload;
    try {
      payload = await this.jwt.verifyAsync<TokenPayload>(token);
    } catch {
      throw new ErpException("unauthorized", "Sessão expirada ou inválida — entre na demonstração de novo", HttpStatus.UNAUTHORIZED);
    }
    request.erpSession = { workspaceId: payload.sub, role: payload.role };

    const roles = this.reflector.getAllAndOverride<erp.Role[] | undefined>(ROLES_KEY, [context.getHandler(), context.getClass()]);
    if (roles && !roles.includes(payload.role)) throw forbidden();
    return true;
  }
}

const ROLES_KEY = "erp:roles";

/** Restringe a rota a papéis específicos (ex.: só admin altera preço). */
export const Roles = (...roles: erp.Role[]) => SetMetadata(ROLES_KEY, roles);

/** Injeta a sessão validada pelo SessionGuard. */
export const Session = createParamDecorator((_: unknown, context: ExecutionContext): ErpSession => {
  const session = context.switchToHttp().getRequest<RequestWithSession>().erpSession;
  if (!session) throw new ErpException("unauthorized", "Sessão ausente", HttpStatus.UNAUTHORIZED);
  return session;
});
