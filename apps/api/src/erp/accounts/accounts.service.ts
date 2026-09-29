import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import type { erp } from "@portfolio/shared";
import type { ErpSession, TokenPayload } from "../common/auth";
import { ErpException, forbidden, invalidState, notFound } from "../common/errors";
import { AccessRequest, Invite, Order, PasswordReset, Product, User, Workspace } from "../schemas";
import { dummyHash, hashPassword, hashToken, newLinkToken, safeEqual, verifyPassword } from "./password";

/** Sessão de conta: 12 horas; depois, login de novo. */
const SESSION_SECONDS = 12 * 3600;
const INVITE_TTL_MS = 48 * 3_600_000;
const RESET_TTL_MS = 24 * 3_600_000;
/** 5 senhas erradas seguidas bloqueiam o login da conta por 15 minutos. */
const MAX_FAILED_LOGINS = 5;
const LOCK_MS = 15 * 60_000;
/** Teto de pedidos pendentes: protege o banco gratuito de enxurrada de robô. */
const MAX_PENDING_REQUESTS = 200;
/** Pedido já decidido fica 30 dias para consulta e depois some (TTL). */
const DECIDED_TTL_MS = 30 * 24 * 3_600_000;

const INVALID_LOGIN = "E-mail ou senha inválidos";

type UserDoc = User & { _id: Types.ObjectId };

const iso = (date: Date) => date.toISOString();
const isDuplicateKey = (error: unknown) => typeof error === "object" && error !== null && (error as { code?: unknown }).code === 11000;

/**
 * Contas de verdade, com acesso só por convite.
 *
 * Regras de quem pode o quê:
 * - Administrador: convida, bloqueia, troca o papel e gera link de senha só de
 *   pessoas da própria empresa — nunca de si mesmo nem do dono.
 * - Dono do sistema: o mesmo, em qualquer empresa, e cria empresas novas.
 * - Link de convite ou de senha: uso único, com validade, e o banco guarda só
 *   o hash do token.
 */
@Injectable()
export class AccountsService {
  private readonly logger = new Logger("Accounts");

  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Invite.name) private readonly invites: Model<Invite>,
    @InjectModel(PasswordReset.name) private readonly resets: Model<PasswordReset>,
    @InjectModel(AccessRequest.name) private readonly requests: Model<AccessRequest>,
    @InjectModel(Workspace.name) private readonly workspaces: Model<Workspace>,
    @InjectModel(Product.name) private readonly products: Model<Product>,
    @InjectModel(Order.name) private readonly orders: Model<Order>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  // ---- Instalação (uma vez) --------------------------------------------------------

  async setupAvailable(): Promise<boolean> {
    return Boolean(this.config.get<string>("ERP_SETUP_TOKEN")) && !(await this.users.exists({ isOwner: true }));
  }

  /** Cria a empresa do dono e a conta dele. Exige o token de instalação e só funciona uma vez. */
  async setup(input: erp.SetupInput): Promise<erp.AccountSession> {
    const expected = this.config.get<string>("ERP_SETUP_TOKEN");
    if (!expected || !safeEqual(input.token, expected)) throw new ErpException("forbidden", "Token de instalação inválido", HttpStatus.FORBIDDEN);
    if (await this.users.exists({ isOwner: true })) throw invalidState("O sistema já foi instalado");

    const workspace = await this.workspaces.create({ name: input.companyName, kind: "real" });
    try {
      const user = await this.users.create({
        workspaceId: workspace._id,
        name: input.name,
        email: input.email,
        passwordHash: await hashPassword(input.password),
        role: "admin",
        isOwner: true,
        lastLoginAt: new Date(),
      });
      this.logger.log(`Sistema instalado por ${input.email}`);
      return this.session(user.toObject(), workspace.name);
    } catch (error) {
      await this.workspaces.deleteOne({ _id: workspace._id });
      if (isDuplicateKey(error)) throw invalidState("O sistema já foi instalado");
      throw error;
    }
  }

  // ---- Login e senha -----------------------------------------------------------------

  async login(input: erp.LoginInput): Promise<erp.AccountSession> {
    const user = await this.users.findOne({ email: input.email }).lean();
    if (!user) {
      await verifyPassword(input.password, await dummyHash());
      throw this.invalidLogin();
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ErpException("rate_limited", "Muitas tentativas erradas. Tente de novo em alguns minutos.", HttpStatus.TOO_MANY_REQUESTS);
    }

    if (!(await verifyPassword(input.password, user.passwordHash))) {
      const failed = user.failedLogins + 1;
      await this.users.updateOne(
        { _id: user._id },
        failed >= MAX_FAILED_LOGINS ? { $set: { failedLogins: 0, lockedUntil: new Date(Date.now() + LOCK_MS) } } : { $set: { failedLogins: failed } },
      );
      throw this.invalidLogin();
    }
    if (user.status !== "active") throw new ErpException("forbidden", "Seu acesso está bloqueado. Fale com o administrador.", HttpStatus.FORBIDDEN);

    await this.users.updateOne({ _id: user._id }, { $set: { failedLogins: 0, lastLoginAt: new Date() }, $unset: { lockedUntil: 1 } });
    return this.session(user, await this.workspaceName(user.workspaceId));
  }

  async changePassword(session: ErpSession, input: erp.ChangePasswordInput): Promise<erp.AccountSession> {
    const user = await this.users.findById(session.userId).lean();
    if (!user) throw notFound("Usuário");
    if (!(await verifyPassword(input.current, user.passwordHash))) {
      throw new ErpException("validation_error", "Senha atual incorreta", HttpStatus.BAD_REQUEST, { issues: [{ path: "current", message: "Senha atual incorreta" }] });
    }
    // Versão nova derruba as outras sessões abertas; esta recebe um token novo.
    const updated = await this.users
      .findByIdAndUpdate(user._id, { $set: { passwordHash: await hashPassword(input.next) }, $inc: { tokenVersion: 1 } }, { returnDocument: "after" })
      .lean();
    return this.session(updated!, await this.workspaceName(user.workspaceId));
  }

  // ---- Convites ----------------------------------------------------------------------

  async createInvite(session: ErpSession, input: erp.InviteCreateInput): Promise<erp.CreatedLink> {
    const workspaceId = input.workspaceId && session.isOwner ? input.workspaceId : session.workspaceId;
    const workspace = await this.workspaces.findOne({ _id: workspaceId, kind: "real" }).lean();
    if (!workspace) throw notFound("Empresa");
    if (await this.users.exists({ email: input.email })) throw new ErpException("conflict", "Já existe uma conta com este e-mail", HttpStatus.CONFLICT, { field: "email" });

    // Um convite pendente por e-mail e empresa: o novo substitui o anterior.
    await this.invites.deleteMany({ workspaceId: workspace._id, email: input.email, usedAt: { $exists: false } });
    const token = newLinkToken();
    const expiresAt = new Date(Date.now() + INVITE_TTL_MS);
    await this.invites.create({ workspaceId: workspace._id, email: input.email, role: input.role, tokenHash: hashToken(token), createdBy: session.userId, expiresAt });
    return { token, expiresAt: iso(expiresAt) };
  }

  async previewInvite(token: string): Promise<erp.InvitePreview> {
    const invite = await this.findLink(this.invites, token, "Convite");
    const workspace = await this.workspaces.findById(invite.workspaceId).lean();
    if (!workspace) throw notFound("Convite");
    return { email: invite.email, role: invite.role, workspace: { name: workspace.name }, expiresAt: iso(invite.expiresAt) };
  }

  async acceptInvite(token: string, input: erp.AcceptInviteInput): Promise<erp.AccountSession> {
    const pending = await this.findLink(this.invites, token, "Convite");
    if (await this.users.exists({ email: pending.email })) throw new ErpException("conflict", "Já existe uma conta com este e-mail", HttpStatus.CONFLICT);

    // Marca como usado de forma atômica: dois cliques no mesmo link não criam duas contas.
    const invite = await this.invites.findOneAndUpdate({ _id: pending._id, usedAt: { $exists: false } }, { $set: { usedAt: new Date() } }, { returnDocument: "after" }).lean();
    if (!invite) throw notFound("Convite");
    try {
      const user = await this.users.create({
        workspaceId: invite.workspaceId,
        name: input.name,
        email: invite.email,
        passwordHash: await hashPassword(input.password),
        role: invite.role,
        lastLoginAt: new Date(),
      });
      return this.session(user.toObject(), await this.workspaceName(invite.workspaceId));
    } catch (error) {
      if (isDuplicateKey(error)) throw new ErpException("conflict", "Já existe uma conta com este e-mail", HttpStatus.CONFLICT);
      throw error;
    }
  }

  async revokeInvite(session: ErpSession, id: string): Promise<void> {
    const filter = session.isOwner ? { _id: id } : { _id: id, workspaceId: new Types.ObjectId(session.workspaceId) };
    const result = await this.invites.deleteOne({ ...filter, usedAt: { $exists: false } });
    if (result.deletedCount === 0) throw notFound("Convite");
  }

  // ---- Troca de senha por link (sem e-mail: quem gera manda o link) ------------------

  async createResetLink(session: ErpSession, userId: string): Promise<erp.CreatedLink> {
    const target = await this.manageable(session, userId);
    await this.resets.deleteMany({ userId: target._id, usedAt: { $exists: false } });
    const token = newLinkToken();
    const expiresAt = new Date(Date.now() + RESET_TTL_MS);
    await this.resets.create({ userId: target._id, tokenHash: hashToken(token), createdBy: session.userId, expiresAt });
    return { token, expiresAt: iso(expiresAt) };
  }

  async previewReset(token: string): Promise<erp.ResetPreview> {
    const reset = await this.findLink(this.resets, token, "Link");
    const user = await this.users.findById(reset.userId).lean();
    if (!user) throw notFound("Link");
    return { email: user.email, name: user.name, expiresAt: iso(reset.expiresAt) };
  }

  async resetPassword(token: string, password: string): Promise<erp.AccountSession> {
    const pending = await this.findLink(this.resets, token, "Link");
    const reset = await this.resets.findOneAndUpdate({ _id: pending._id, usedAt: { $exists: false } }, { $set: { usedAt: new Date() } }).lean();
    if (!reset) throw notFound("Link");
    const user = await this.users
      .findByIdAndUpdate(
        reset.userId,
        { $set: { passwordHash: await hashPassword(password), failedLogins: 0, lastLoginAt: new Date() }, $unset: { lockedUntil: 1 }, $inc: { tokenVersion: 1 } },
        { returnDocument: "after" },
      )
      .lean();
    if (!user) throw notFound("Link");
    if (user.status !== "active") throw new ErpException("forbidden", "Seu acesso está bloqueado. Fale com o administrador.", HttpStatus.FORBIDDEN);
    return this.session(user, await this.workspaceName(user.workspaceId));
  }

  // ---- Equipe (administrador da empresa) ---------------------------------------------

  async team(session: ErpSession): Promise<erp.Team> {
    const workspaceId = new Types.ObjectId(session.workspaceId);
    const [members, invites] = await Promise.all([
      this.users.find({ workspaceId }).sort({ name: 1 }).lean(),
      this.invites.find({ workspaceId, usedAt: { $exists: false }, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 }).lean(),
    ]);
    return { members: members.map((user) => this.toMember(user)), invites: invites.map((invite) => this.toInvite(invite)) };
  }

  async updateMember(session: ErpSession, userId: string, input: erp.MemberUpdate): Promise<erp.TeamMember> {
    const target = await this.manageable(session, userId);
    const blocking = input.status === "blocked" && target.status !== "blocked";
    const updated = await this.users
      .findByIdAndUpdate(
        target._id,
        { $set: { ...(input.role ? { role: input.role } : {}), ...(input.status ? { status: input.status } : {}) }, ...(blocking ? { $inc: { tokenVersion: 1 } } : {}) },
        { returnDocument: "after" },
      )
      .lean();
    return this.toMember(updated!, session.isOwner ? await this.workspaceRef(updated!.workspaceId) : undefined);
  }

  // ---- Painel do dono ----------------------------------------------------------------

  async overview(): Promise<erp.OwnerOverview> {
    const now = new Date();
    const [companies, users, blockedUsers, pendingInvites, activeDemos, recent, pendingRequests] = await Promise.all([
      this.workspaces.countDocuments({ kind: "real" }),
      this.users.countDocuments(),
      this.users.countDocuments({ status: "blocked" }),
      this.invites.countDocuments({ usedAt: { $exists: false }, expiresAt: { $gt: now } }),
      this.workspaces.countDocuments({ kind: { $ne: "real" }, expiresAt: { $gt: now } }),
      this.users.find({ lastLoginAt: { $exists: true } }).sort({ lastLoginAt: -1 }).limit(8).lean(),
      this.requests.countDocuments({ status: "pending" }),
    ]);
    const names = await this.workspaceNames(recent.map((user) => user.workspaceId));
    return {
      companies,
      users,
      blockedUsers,
      pendingInvites,
      pendingRequests,
      activeDemos,
      demoCapacity: Number(this.config.get("ERP_MAX_WORKSPACES") ?? 300),
      lastLogins: recent.map((user) => ({ name: user.name, email: user.email, workspace: names.get(user.workspaceId.toString()) ?? "—", at: iso(user.lastLoginAt!) })),
    };
  }

  async companies(): Promise<erp.Company[]> {
    const list = await this.workspaces.find({ kind: "real" }).sort({ createdAt: 1 }).lean();
    const ids = list.map((workspace) => workspace._id);
    const count = async (model: Model<User> | Model<Product>, match: object) =>
      new Map(
        (await model.aggregate<{ _id: Types.ObjectId; total: number }>([{ $match: { workspaceId: { $in: ids }, ...match } }, { $group: { _id: "$workspaceId", total: { $sum: 1 } } }])).map(
          (row) => [row._id.toString(), row.total],
        ),
      );
    const [users, products, orders, revenue] = await Promise.all([
      count(this.users, {}),
      count(this.products, { active: true }),
      this.orders.aggregate<{ _id: Types.ObjectId; total: number }>([{ $match: { workspaceId: { $in: ids } } }, { $group: { _id: "$workspaceId", total: { $sum: 1 } } }]),
      this.orders.aggregate<{ _id: Types.ObjectId; total: number }>([
        { $match: { workspaceId: { $in: ids }, status: "confirmed" } },
        { $group: { _id: "$workspaceId", total: { $sum: "$totalCents" } } },
      ]),
    ]);
    const byId = (rows: { _id: Types.ObjectId; total: number }[]) => new Map(rows.map((row) => [row._id.toString(), row.total]));
    const [orderCount, revenueSum] = [byId(orders), byId(revenue)];
    return list.map((workspace) => {
      const key = workspace._id.toString();
      return {
        id: key,
        name: workspace.name,
        createdAt: iso((workspace as { createdAt?: Date }).createdAt ?? new Date(0)),
        users: users.get(key) ?? 0,
        products: products.get(key) ?? 0,
        orders: orderCount.get(key) ?? 0,
        revenueCents: revenueSum.get(key) ?? 0,
      };
    });
  }

  async createCompany(name: string): Promise<erp.Company> {
    const workspace = await this.workspaces.create({ name, kind: "real" });
    return { id: workspace._id.toString(), name, createdAt: iso(new Date()), users: 0, products: 0, orders: 0, revenueCents: 0 };
  }

  async allUsers(): Promise<erp.TeamMember[]> {
    const users = await this.users.find().sort({ name: 1 }).lean();
    const names = await this.workspaceNames(users.map((user) => user.workspaceId));
    return users.map((user) => this.toMember(user, { id: user.workspaceId.toString(), name: names.get(user.workspaceId.toString()) ?? "—" }));
  }

  async allInvites(): Promise<erp.Invite[]> {
    const invites = await this.invites.find({ usedAt: { $exists: false }, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 }).lean();
    const names = await this.workspaceNames(invites.map((invite) => invite.workspaceId));
    return invites.map((invite) => this.toInvite(invite, { id: invite.workspaceId.toString(), name: names.get(invite.workspaceId.toString()) ?? "—" }));
  }

  // ---- Pedidos de acesso -------------------------------------------------------------

  /**
   * Pedido público. A resposta é sempre a mesma ("recebido"), exista ou não
   * conta ou pedido com esse e-mail: a página não serve para descobrir quem
   * está cadastrado. Robô que preenche a armadilha (`website`) é ignorado.
   */
  async requestAccess(input: erp.AccessRequestInput): Promise<void> {
    if (input.website) return;
    if (await this.users.exists({ email: input.email })) return;
    if ((await this.requests.countDocuments({ status: "pending" })) >= MAX_PENDING_REQUESTS) {
      throw new ErpException("rate_limited", "Muitos pedidos no momento. Tente de novo mais tarde.", HttpStatus.SERVICE_UNAVAILABLE);
    }
    try {
      await this.requests.create({ name: input.name, email: input.email, company: input.company || undefined, message: input.message || undefined });
    } catch (error) {
      if (!isDuplicateKey(error)) throw error; // já tem pedido pendente com esse e-mail
    }
  }

  async accessRequests(): Promise<erp.AccessRequest[]> {
    const list = await this.requests.find({ status: "pending" }).sort({ createdAt: 1 }).lean();
    return list.map((request) => ({
      id: request._id.toString(),
      name: request.name,
      email: request.email,
      ...(request.company ? { company: request.company } : {}),
      ...(request.message ? { message: request.message } : {}),
      status: request.status,
      createdAt: iso(request.createdAt),
    }));
  }

  /** Aprovar vira convite (na empresa escolhida ou numa nova, criada com o nome informado). */
  async approveRequest(session: ErpSession, id: string, input: erp.AccessApproveInput): Promise<erp.CreatedLink> {
    const request = await this.requests.findOne({ _id: id, status: "pending" }).lean();
    if (!request) throw notFound("Pedido");
    const workspaceId = input.companyName ? (await this.createCompany(input.companyName)).id : input.workspaceId!;
    const link = await this.createInvite(session, { email: request.email, role: input.companyName ? "admin" : input.role, workspaceId });
    await this.decide(request._id, "approved");
    return link;
  }

  async rejectRequest(id: string): Promise<void> {
    const request = await this.requests.findOne({ _id: id, status: "pending" }).lean();
    if (!request) throw notFound("Pedido");
    await this.decide(request._id, "rejected");
  }

  private async decide(id: Types.ObjectId, status: "approved" | "rejected") {
    const now = new Date();
    await this.requests.updateOne({ _id: id }, { $set: { status, decidedAt: now, expiresAt: new Date(now.getTime() + DECIDED_TTL_MS) } });
  }

  // ---- Apoio -------------------------------------------------------------------------

  /** Quem pode mexer em quem: nunca em si mesmo nem no dono; admin só na própria empresa. */
  private async manageable(session: ErpSession, userId: string): Promise<UserDoc> {
    const target = await this.users.findById(userId).lean();
    if (!target) throw notFound("Usuário");
    if (!session.isOwner && target.workspaceId.toString() !== session.workspaceId) throw notFound("Usuário");
    if (target._id.toString() === session.userId) throw invalidState("Use a tela Minha conta para alterar o seu próprio acesso");
    if (target.isOwner) throw forbidden();
    return target;
  }

  private async findLink<T extends { tokenHash: string; usedAt?: Date; expiresAt: Date }>(model: Model<T>, token: string, what: string) {
    const link = (await model.findOne({ tokenHash: hashToken(token) }).lean()) as (T & { _id: Types.ObjectId }) | null;
    if (!link || link.usedAt || link.expiresAt <= new Date()) throw new ErpException("not_found", `${what} inválido, já usado ou vencido`, HttpStatus.NOT_FOUND);
    return link;
  }

  private async session(user: UserDoc, workspaceName: string): Promise<erp.AccountSession> {
    const payload: TokenPayload = { sub: user.workspaceId.toString(), role: user.role, uid: user._id.toString(), ver: user.tokenVersion };
    const token = await this.jwt.signAsync(payload, { expiresIn: SESSION_SECONDS });
    return {
      kind: "account",
      token,
      role: user.role,
      workspace: { id: user.workspaceId.toString(), name: workspaceName },
      user: { id: user._id.toString(), name: user.name, email: user.email, isOwner: user.isOwner },
      expiresAt: iso(new Date(Date.now() + SESSION_SECONDS * 1000)),
    };
  }

  private invalidLogin() {
    return new ErpException("unauthorized", INVALID_LOGIN, HttpStatus.UNAUTHORIZED);
  }

  private async workspaceName(id: Types.ObjectId) {
    return (await this.workspaces.findById(id).lean())?.name ?? "—";
  }

  private async workspaceRef(id: Types.ObjectId) {
    return { id: id.toString(), name: await this.workspaceName(id) };
  }

  private async workspaceNames(ids: Types.ObjectId[]) {
    const list = await this.workspaces.find({ _id: { $in: ids } }, { name: 1 }).lean();
    return new Map(list.map((workspace) => [workspace._id.toString(), workspace.name]));
  }

  private toMember(user: UserDoc, workspace?: { id: string; name: string }): erp.TeamMember {
    return {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      isOwner: user.isOwner,
      ...(user.lastLoginAt ? { lastLoginAt: iso(user.lastLoginAt) } : {}),
      createdAt: iso(user.createdAt ?? new Date(0)),
      ...(workspace ? { workspace } : {}),
    };
  }

  private toInvite(invite: Invite & { _id: Types.ObjectId }, workspace?: { id: string; name: string }): erp.Invite {
    return {
      id: invite._id.toString(),
      email: invite.email,
      role: invite.role,
      expiresAt: iso(invite.expiresAt),
      createdAt: iso(invite.createdAt ?? new Date(0)),
      ...(workspace ? { workspace } : {}),
    };
  }
}
