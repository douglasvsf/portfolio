import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
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
  Counter,
  CounterSchema,
  Customer,
  CustomerSchema,
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
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>("ERP_JWT_SECRET");
        if (!secret && config.get("NODE_ENV") === "production") throw new Error("ERP_JWT_SECRET não configurado");
        // Fora de produção, um segredo fixo de desenvolvimento (tokens locais não valem em produção).
        return { secret: secret ?? "dev-only-erp-secret-change-me" };
      },
    }),
  ],
  controllers: [SessionController, ProductsController, StockController, CustomersController, OrdersController, PosController, DashboardController],
  providers: [WorkspacesService, CatalogService, StockService, OrdersService, PosService, DashboardService, SessionGuard],
})
export class ErpModule {}
