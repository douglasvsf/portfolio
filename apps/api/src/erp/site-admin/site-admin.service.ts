import { HttpStatus, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import type { admin } from "@portfolio/shared";
import { dummyHash, hashPassword, verifyPassword } from "../accounts/password";
import { ErpException } from "../common/errors";
import { SiteAdmin, User } from "../schemas";

const SESSION_SECONDS = 12 * 3600;
const MAX_FAILED_LOGINS = 5;
const LOCK_MS = 15 * 60_000;

/** Marca o token como do painel do site: o ERP recusa esse token, e o painel recusa os do ERP. */
export const SITE_ADMIN_AUDIENCE = "site-admin";

export interface SiteAdminToken {
  sub: string;
  ver: number;
  aud: string;
}

/**
 * Login do painel administrativo do portfólio (/admin). Existe um só, criado
 * uma única vez — o cadastro se fecha sozinho depois disso — e separado das
 * contas do ERP: outra coleção, outro tipo de token.
 */
@Injectable()
export class SiteAdminService {
  constructor(
    @InjectModel(SiteAdmin.name) private readonly admins: Model<SiteAdmin>,
    @InjectModel(User.name) private readonly users: Model<User>,
    private readonly jwt: JwtService,
  ) {}

  async setupAvailable(): Promise<boolean> {
    return !(await this.admins.exists({}));
  }

  /**
   * Cria o login do painel. Quem pede é o dono do sistema (a rota confere);
   * o nome vem da conta dele. O índice único em `slot` garante um só, mesmo
   * com duas requisições ao mesmo tempo.
   */
  async setup(ownerId: string, input: admin.AdminSetupInput): Promise<admin.AdminSession> {
    if (!(await this.setupAvailable())) throw this.alreadyDone();
    const owner = await this.users.findById(ownerId).lean();
    try {
      const created = await this.admins.create({ slot: "site", name: owner?.name ?? "Admin", email: input.email, passwordHash: await hashPassword(input.password), lastLoginAt: new Date() });
      return this.session(created.toObject());
    } catch (error) {
      if ((error as { code?: number }).code === 11000) throw this.alreadyDone();
      throw error;
    }
  }

  async login(input: admin.AdminLoginInput): Promise<admin.AdminSession> {
    const found = await this.admins.findOne({ email: input.email }).lean();
    if (!found) {
      // Mesmo tempo de resposta de uma senha errada: não revela qual é o e-mail do painel.
      await verifyPassword(input.password, await dummyHash());
      throw this.invalidLogin();
    }
    if (found.lockedUntil && found.lockedUntil > new Date()) {
      throw new ErpException("rate_limited", "Muitas tentativas erradas. Tente de novo em alguns minutos.", HttpStatus.TOO_MANY_REQUESTS);
    }
    if (!(await verifyPassword(input.password, found.passwordHash))) {
      const failed = found.failedLogins + 1;
      await this.admins.updateOne(
        { _id: found._id },
        failed >= MAX_FAILED_LOGINS ? { $set: { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCK_MS) } } : { $set: { failedLogins: failed } },
      );
      throw this.invalidLogin();
    }
    await this.admins.updateOne({ _id: found._id }, { $set: { failedLogins: 0, lastLoginAt: new Date() }, $unset: { lockedUntil: 1 } });
    return this.session(found);
  }

  /** Confere o token a cada requisição: precisa ser do painel e da versão atual da conta. */
  async verify(token: string): Promise<boolean> {
    try {
      const payload = await this.jwt.verifyAsync<SiteAdminToken>(token, { audience: SITE_ADMIN_AUDIENCE });
      if (!Types.ObjectId.isValid(payload.sub)) return false;
      const found = await this.admins.findById(payload.sub).lean();
      return Boolean(found && found.tokenVersion === payload.ver);
    } catch {
      return false;
    }
  }

  private async session(found: SiteAdmin & { _id: Types.ObjectId }): Promise<admin.AdminSession> {
    const token = await this.jwt.signAsync({ sub: found._id.toString(), ver: found.tokenVersion }, { expiresIn: SESSION_SECONDS, audience: SITE_ADMIN_AUDIENCE });
    return { token, name: found.name, email: found.email, expiresAt: new Date(Date.now() + SESSION_SECONDS * 1000).toISOString() };
  }

  private invalidLogin() {
    return new ErpException("unauthorized", "E-mail ou senha inválidos", HttpStatus.UNAUTHORIZED);
  }

  private alreadyDone() {
    return new ErpException("conflict", "O login do painel já foi criado", HttpStatus.CONFLICT);
  }
}
