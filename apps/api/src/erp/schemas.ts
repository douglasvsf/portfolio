import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { erp } from "@portfolio/shared";

/**
 * Modelos do ERP. Multi-tenancy por coluna: todo documento tem `workspaceId`
 * (a empresa demo) e `expiresAt` com índice TTL — quando a demo expira, o
 * próprio Mongo apaga a empresa e tudo dela, sem job de limpeza.
 */

const ttl = { type: Date, required: true, index: { expires: 0 } } as const;
const tenant = { type: Types.ObjectId, required: true, index: true } as const;

@Schema({ timestamps: true, collection: "erp_workspaces" })
export class Workspace {
  @Prop({ required: true }) name!: string;
  @Prop(ttl) expiresAt!: Date;
}
export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);

@Schema({ timestamps: true, collection: "erp_products" })
export class Product {
  @Prop(tenant) workspaceId!: Types.ObjectId;
  @Prop({ required: true }) sku!: string;
  @Prop({ required: true }) name!: string;
  @Prop({ type: String, required: true, enum: erp.PRODUCT_CATEGORIES }) category!: erp.ProductCategory;
  @Prop({ type: String, required: true, enum: erp.UNITS }) unit!: erp.Unit;
  @Prop({ required: true, min: 1 }) priceCents!: number;
  @Prop({ required: true, min: 0 }) costCents!: number;
  @Prop({ required: true, min: 0 }) minStock!: number;
  /** EAN (embalado) ou PLU da balança (kg). Único por empresa quando existe. */
  @Prop() barcode?: string;
  /** Nunca negativo: o banco também recusa (min: 0), além da regra no serviço. */
  @Prop({ required: true, min: 0, default: 0 }) stock!: number;
  @Prop({ required: true, default: true }) active!: boolean;
  @Prop(ttl) expiresAt!: Date;
}
export const ProductSchema = SchemaFactory.createForClass(Product);
ProductSchema.index({ workspaceId: 1, sku: 1 }, { unique: true });
ProductSchema.index({ workspaceId: 1, barcode: 1 }, { unique: true, partialFilterExpression: { barcode: { $type: "string" } } });

@Schema({ timestamps: true, collection: "erp_customers" })
export class Customer {
  @Prop(tenant) workspaceId!: Types.ObjectId;
  @Prop({ required: true }) name!: string;
  /** Só dígitos. */
  @Prop({ required: true }) document!: string;
  @Prop() email?: string;
  @Prop() phone?: string;
  @Prop() city?: string;
  @Prop(ttl) expiresAt!: Date;
}
export const CustomerSchema = SchemaFactory.createForClass(Customer);
CustomerSchema.index({ workspaceId: 1, document: 1 }, { unique: true });

/** Livro-razão do estoque: só se insere, nunca se edita. */
@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: "erp_stock_movements" })
export class StockMovement {
  @Prop(tenant) workspaceId!: Types.ObjectId;
  @Prop({ type: Types.ObjectId, required: true }) productId!: Types.ObjectId;
  @Prop({ required: true }) productName!: string;
  @Prop({ type: String, required: true, enum: erp.MOVEMENT_TYPES }) type!: erp.MovementType;
  @Prop({ required: true }) delta!: number;
  @Prop({ required: true, min: 0 }) balanceAfter!: number;
  @Prop({ required: true }) reason!: string;
  @Prop({ type: Types.ObjectId }) orderId?: Types.ObjectId;
  @Prop() orderNumber?: number;
  @Prop({ type: String, required: true, enum: erp.ROLES }) role!: erp.Role;
  @Prop(ttl) expiresAt!: Date;
  createdAt!: Date;
}
export const StockMovementSchema = SchemaFactory.createForClass(StockMovement);
StockMovementSchema.index({ workspaceId: 1, createdAt: -1 });
StockMovementSchema.index({ workspaceId: 1, productId: 1, createdAt: -1 });

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, required: true }) productId!: Types.ObjectId;
  @Prop({ required: true }) sku!: string;
  @Prop({ required: true }) name!: string;
  @Prop({ type: String, required: true, enum: erp.UNITS }) unit!: erp.Unit;
  @Prop({ type: String, required: true, enum: erp.PRODUCT_CATEGORIES }) category!: erp.ProductCategory;
  @Prop({ required: true }) quantity!: number;
  @Prop({ required: true }) unitPriceCents!: number;
  @Prop({ required: true }) totalCents!: number;
}
const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ _id: false })
export class Payment {
  @Prop({ type: String, required: true, enum: erp.PAYMENT_METHODS }) method!: erp.PaymentMethod;
  @Prop({ required: true, min: 1 }) amountCents!: number;
}
const PaymentSchema = SchemaFactory.createForClass(Payment);

@Schema({ timestamps: true, collection: "erp_orders" })
export class Order {
  @Prop(tenant) workspaceId!: Types.ObjectId;
  @Prop({ required: true }) number!: number;
  @Prop({ type: String, required: true, enum: erp.ORDER_CHANNELS, default: "order" }) channel!: erp.OrderChannel;
  /** Ausente na venda de balcão sem cliente (consumidor final). */
  @Prop({ type: Types.ObjectId }) customerId?: Types.ObjectId;
  @Prop() customerName?: string;
  @Prop({ type: [OrderItemSchema], required: true }) items!: OrderItem[];
  @Prop({ required: true }) subtotalCents!: number;
  @Prop({ required: true, default: 0 }) discountCents!: number;
  @Prop({ required: true }) totalCents!: number;
  @Prop({ type: String, required: true, enum: erp.ORDER_STATUSES, default: "draft" }) status!: erp.OrderStatus;
  @Prop({ type: [PaymentSchema], default: undefined }) payments?: Payment[];
  @Prop() changeCents?: number;
  /** Idempotency-Key da venda no PDV e a impressão digital do corpo enviado. */
  @Prop() idempotencyKey?: string;
  @Prop() idempotencyHash?: string;
  @Prop() notes?: string;
  @Prop({ type: String, required: true, enum: erp.ROLES }) createdByRole!: erp.Role;
  @Prop() confirmedAt?: Date;
  @Prop() cancelledAt?: Date;
  @Prop(ttl) expiresAt!: Date;
  createdAt!: Date;
}
export const OrderSchema = SchemaFactory.createForClass(Order);
OrderSchema.index({ workspaceId: 1, number: 1 }, { unique: true });
OrderSchema.index({ workspaceId: 1, status: 1, createdAt: -1 });
OrderSchema.index({ workspaceId: 1, idempotencyKey: 1 }, { unique: true, partialFilterExpression: { idempotencyKey: { $type: "string" } } });

/** Sequência por empresa (número do pedido), incrementada de forma atômica. */
@Schema({ collection: "erp_counters" })
export class Counter {
  @Prop(tenant) workspaceId!: Types.ObjectId;
  @Prop({ required: true }) name!: string;
  @Prop({ required: true, default: 0 }) value!: number;
  @Prop(ttl) expiresAt!: Date;
}
export const CounterSchema = SchemaFactory.createForClass(Counter);
CounterSchema.index({ workspaceId: 1, name: 1 }, { unique: true });

export type ProductDocument = HydratedDocument<Product>;
export type CustomerDocument = HydratedDocument<Customer>;
export type OrderDocument = HydratedDocument<Order>;
export type StockMovementDocument = HydratedDocument<StockMovement>;
