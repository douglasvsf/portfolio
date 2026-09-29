import { Body, Controller, Delete, Get, Headers, HttpCode, HttpStatus, Param, Patch, Post, Query, Res, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { Throttle } from "@nestjs/throttler";
import { erp } from "@portfolio/shared";
import { Roles, Session, SessionGuard, type ErpSession } from "./common/auth";
import { ApiZodBody, ApiZodQuery, ZodPipe } from "./common/zod";
import { CatalogService } from "./catalog/catalog.service";
import { DashboardService } from "./dashboard/dashboard.service";
import { ErpException } from "./common/errors";
import { OrdersService } from "./orders/orders.service";
import { PosService } from "./pos/pos.service";
import { StockService } from "./stock/stock.service";
import { WorkspacesService } from "./workspaces/workspaces.service";

/**
 * Rotas do ERP (/erp/...). Permissões:
 * - admin: tudo;
 * - seller (vendedor): consulta produtos e estoque, cadastra clientes e
 *   pedidos; não altera preço/custo, não movimenta estoque, não exclui.
 */

const id = new ZodPipe(erp.objectIdSchema);

@ApiTags("Sessão")
@Controller("erp")
export class SessionController {
  constructor(private readonly workspaces: WorkspacesService) {}

  @Post("sessions/demo")
  @Throttle({ default: { limit: 5, ttl: 3_600_000 } })
  @ApiOperation({ summary: "Cria uma empresa demo isolada (24h) com dados de um mercado e devolve o token (admin)" })
  createDemo() {
    return this.workspaces.createDemo();
  }

  @Post("sessions/role")
  @HttpCode(200)
  @UseGuards(SessionGuard)
  @ApiBearerAuth()
  @ApiZodBody(erp.roleSwitchSchema)
  @ApiOperation({ summary: "Troca o papel (admin ↔ vendedor) na mesma empresa" })
  switchRole(@Session() session: ErpSession, @Body(new ZodPipe(erp.roleSwitchSchema)) body: { role: erp.Role }) {
    return this.workspaces.switchRole(session, body.role);
  }

  @Get("me")
  @UseGuards(SessionGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Empresa e papel da sessão atual" })
  me(@Session() session: ErpSession) {
    return this.workspaces.me(session);
  }
}

@ApiTags("Produtos")
@ApiBearerAuth()
@UseGuards(SessionGuard)
@Controller("erp/products")
export class ProductsController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @ApiZodQuery(erp.productQuerySchema)
  @ApiOperation({ summary: "Lista produtos ativos (busca por nome/SKU, categoria, estoque baixo)" })
  list(@Session() session: ErpSession, @Query(new ZodPipe(erp.productQuerySchema)) query: erp.ProductQuery) {
    return this.catalog.listProducts(session, query);
  }

  @Get(":id")
  get(@Session() session: ErpSession, @Param("id", id) productId: string) {
    return this.catalog.getProduct(session, productId);
  }

  @Post()
  @Roles("admin")
  @ApiZodBody(erp.productInputSchema)
  @ApiOperation({ summary: "Cadastra produto (admin). Estoque começa em zero — entra por movimentação" })
  create(@Session() session: ErpSession, @Body(new ZodPipe(erp.productInputSchema)) body: erp.ProductInput) {
    return this.catalog.createProduct(session, body);
  }

  @Patch(":id")
  @Roles("admin")
  @ApiZodBody(erp.productUpdateSchema)
  @ApiOperation({ summary: "Atualiza produto, inclusive preço e custo (admin)" })
  update(@Session() session: ErpSession, @Param("id", id) productId: string, @Body(new ZodPipe(erp.productUpdateSchema)) body: erp.ProductUpdate) {
    return this.catalog.updateProduct(session, productId, body);
  }

  @Delete(":id")
  @HttpCode(204)
  @Roles("admin")
  @ApiOperation({ summary: "Desativa o produto (admin) — o histórico continua apontando para ele" })
  async remove(@Session() session: ErpSession, @Param("id", id) productId: string) {
    await this.catalog.deactivateProduct(session, productId);
  }
}

@ApiTags("Estoque")
@ApiBearerAuth()
@UseGuards(SessionGuard)
@Controller("erp/stock/movements")
export class StockController {
  constructor(private readonly stock: StockService) {}

  @Get()
  @ApiZodQuery(erp.stockMovementQuerySchema)
  @ApiOperation({ summary: "Histórico de movimentações (livro-razão), mais recentes primeiro" })
  list(@Session() session: ErpSession, @Query(new ZodPipe(erp.stockMovementQuerySchema)) query: erp.StockMovementQuery) {
    return this.stock.list(session, query);
  }

  @Post()
  @Roles("admin")
  @ApiZodBody(erp.stockMovementInputSchema)
  @ApiOperation({ summary: "Entrada, saída ou ajuste de inventário (admin). Nunca deixa o estoque negativo" })
  create(@Session() session: ErpSession, @Body(new ZodPipe(erp.stockMovementInputSchema)) body: erp.StockMovementInput) {
    return this.stock.register(session, body);
  }
}

@ApiTags("Clientes")
@ApiBearerAuth()
@UseGuards(SessionGuard)
@Controller("erp/customers")
export class CustomersController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @ApiZodQuery(erp.customerQuerySchema)
  @ApiOperation({ summary: "Lista clientes (busca por nome ou CPF/CNPJ)" })
  list(@Session() session: ErpSession, @Query(new ZodPipe(erp.customerQuerySchema)) query: erp.CustomerQuery) {
    return this.catalog.listCustomers(session, query);
  }

  @Get(":id")
  get(@Session() session: ErpSession, @Param("id", id) customerId: string) {
    return this.catalog.getCustomer(session, customerId);
  }

  @Post()
  @ApiZodBody(erp.customerInputSchema)
  @ApiOperation({ summary: "Cadastra cliente (CPF/CNPJ validado)" })
  create(@Session() session: ErpSession, @Body(new ZodPipe(erp.customerInputSchema)) body: erp.CustomerInput) {
    return this.catalog.createCustomer(session, body);
  }

  @Patch(":id")
  @ApiZodBody(erp.customerUpdateSchema)
  update(@Session() session: ErpSession, @Param("id", id) customerId: string, @Body(new ZodPipe(erp.customerUpdateSchema)) body: erp.CustomerUpdate) {
    return this.catalog.updateCustomer(session, customerId, body);
  }

  @Delete(":id")
  @HttpCode(204)
  @Roles("admin")
  @ApiOperation({ summary: "Exclui cliente sem pedidos (admin)" })
  async remove(@Session() session: ErpSession, @Param("id", id) customerId: string) {
    await this.catalog.deleteCustomer(session, customerId);
  }
}

@ApiTags("Pedidos")
@ApiBearerAuth()
@UseGuards(SessionGuard)
@Controller("erp/orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Get()
  @ApiZodQuery(erp.orderQuerySchema)
  list(@Session() session: ErpSession, @Query(new ZodPipe(erp.orderQuerySchema)) query: erp.OrderQuery) {
    return this.orders.list(session, query);
  }

  @Get(":id")
  get(@Session() session: ErpSession, @Param("id", id) orderId: string) {
    return this.orders.get(session, orderId);
  }

  @Post()
  @ApiZodBody(erp.orderInputSchema)
  @ApiOperation({ summary: "Cria pedido em rascunho (preços congelados no momento)" })
  create(@Session() session: ErpSession, @Body(new ZodPipe(erp.orderInputSchema)) body: erp.OrderInputParsed) {
    return this.orders.create(session, body);
  }

  @Patch(":id")
  @ApiZodBody(erp.orderInputSchema)
  @ApiOperation({ summary: "Edita pedido em rascunho" })
  update(@Session() session: ErpSession, @Param("id", id) orderId: string, @Body(new ZodPipe(erp.orderInputSchema)) body: erp.OrderInputParsed) {
    return this.orders.update(session, orderId, body);
  }

  @Post(":id/confirm")
  @HttpCode(200)
  @ApiOperation({ summary: "Confirma: baixa o estoque de todos os itens numa transação (tudo ou nada)" })
  confirm(@Session() session: ErpSession, @Param("id", id) orderId: string) {
    return this.orders.confirm(session, orderId);
  }

  @Post(":id/cancel")
  @HttpCode(200)
  @ApiOperation({ summary: "Cancela; se já confirmado, devolve o estoque" })
  cancel(@Session() session: ErpSession, @Param("id", id) orderId: string) {
    return this.orders.cancel(session, orderId);
  }
}

@ApiTags("PDV")
@ApiBearerAuth()
@UseGuards(SessionGuard)
@Controller("erp/pos")
export class PosController {
  constructor(private readonly pos: PosService) {}

  @Post("sales")
  @ApiZodBody(erp.posSaleInputSchema)
  @ApiHeader({ name: "Idempotency-Key", required: true, description: "Uma chave por venda (ex.: UUID). Repetir a chave devolve a mesma venda." })
  @ApiOperation({ summary: "Venda no caixa: já nasce confirmada, baixa o estoque e registra os pagamentos (idempotente)" })
  async sell(
    @Session() session: ErpSession,
    @Headers("idempotency-key") key: string | undefined,
    @Body(new ZodPipe(erp.posSaleInputSchema)) body: erp.PosSaleInputParsed,
    @Res({ passthrough: true }) response: Response,
  ) {
    const parsedKey = erp.idempotencyKeySchema.safeParse(key ?? "");
    if (!parsedKey.success) throw new ErpException("validation_error", parsedKey.error.issues[0]!.message, HttpStatus.BAD_REQUEST);
    const { order, replayed } = await this.pos.sell(session, body, parsedKey.data);
    response.status(replayed ? HttpStatus.OK : HttpStatus.CREATED);
    if (replayed) response.setHeader("Idempotent-Replayed", "true");
    return order;
  }
}

@ApiTags("Dashboard")
@ApiBearerAuth()
@UseGuards(SessionGuard)
@Controller("erp/dashboard")
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  @ApiOperation({ summary: "Faturamento por mês, mais vendidos, estoque baixo e pedidos por status" })
  summary(@Session() session: ErpSession) {
    return this.dashboard.summary(session);
  }
}
