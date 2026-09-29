import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthController, OwnerController, TeamController } from "./accounts/accounts.controllers";
import { AccountsService } from "./accounts/accounts.service";
import { CatalogService } from "./catalog/catalog.service";
import { SessionGuard } from "./common/auth";
import { DashboardService } from "./dashboard/dashboard.service";
import {
  CustomersController,
  DashboardController,
  OrdersController,
  PosController,
  ProductsController,
  SessionController,
  StockController,
} from "./erp.controllers";
import { OrdersService } from "./orders/orders.service";
import { PosService } from "./pos/pos.service";
import {
  AccessRequest,
  AccessRequestSchema,
  Counter,
  CounterSchema,
  Customer,
  CustomerSchema,
  Invite,
  InviteSchema,
  PasswordReset,
  PasswordResetSchema,
  User,
  UserSchema,
  Order,
  OrderSchema,
  Product,
  ProductSchema,
  StockMovement,
  StockMovementSchema,
  Workspace,
  WorkspaceSchema,
} from "./schemas";
import { StockService } from "./stock/stock.service";
import { WorkspacesService } from "./workspaces/workspaces.service";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Workspace.name, schema: WorkspaceSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Customer.name, schema: CustomerSchema },
      { name: StockMovement.name, schema: StockMovementSchema },
      { name: Order.name, schema: OrderSchema },
      { name: Counter.name, schema: CounterSchema },
      { name: User.name, schema: UserSchema },
      { name: Invite.name, schema: InviteSchema },
      { name: PasswordReset.name, schema: PasswordResetSchema },
      { name: AccessRequest.name, schema: AccessRequestSchema },
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>("ERP_JWT_SECRET");
        const deployed = config.get("NODE_ENV") === "production" || Boolean(config.get("VERCEL"));
        if (deployed && (!secret || secret.length < 32)) throw new Error("ERP_JWT_SECRET não configurado (mínimo de 32 caracteres)");
        return {
          // Fora do servidor, um segredo fixo de desenvolvimento (tokens locais não valem em produção).
          secret: secret ?? "dev-only-erp-secret-change-me",
          // Algoritmo fixo: um token com outro "alg" no cabeçalho é recusado.
          signOptions: { algorithm: "HS256" },
          verifyOptions: { algorithms: ["HS256"] },
        };
      },
    }),
  ],
  controllers: [SessionController, AuthController, TeamController, OwnerController, ProductsController, StockController, CustomersController, OrdersController, PosController, DashboardController],
  providers: [AccountsService, WorkspacesService, CatalogService, StockService, OrdersService, PosService, DashboardService, SessionGuard],
})
export class ErpModule {}
