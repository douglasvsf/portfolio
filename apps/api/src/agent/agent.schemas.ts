import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Schema as MongooseSchema, Types } from "mongoose";
import { agent } from "@portfolio/shared";
import type { LlmMessage } from "./llm";

/** Sessão do Kaiju Agent: o mercado (ERP) e a loja (Pay) do visitante, e a conversa até aqui. */
@Schema({ timestamps: true, collection: "agent_sessions" })
export class AgentSessionDoc {
  @Prop({ type: Types.ObjectId, required: true }) workspaceId!: Types.ObjectId;
  @Prop({ required: true }) workspaceName!: string;
  @Prop() merchantId?: string;
  @Prop() merchantName?: string;
  /** Mensagens enviadas ao modelo (cortadas nas últimas conversas). */
  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] }) history!: LlmMessage[];
  @Prop({ required: true, default: 0 }) turns!: number;
  /** Trava contra duas mensagens ao mesmo tempo na mesma conversa. */
  @Prop() busyUntil?: Date;
  @Prop({ type: Date, required: true, index: { expires: 0 } }) expiresAt!: Date;
}
export const AgentSessionSchema = SchemaFactory.createForClass(AgentSessionDoc);

export interface PendingAction {
  stepId: string;
  toolCallId: string;
  tool: string;
  args: unknown;
  /** Passos do laço que sobram para depois da confirmação. */
  budgetLeft: number;
}

/** Um turno (uma mensagem da pessoa e tudo o que o agente fez). Fica 7 dias para auditoria no /admin. */
@Schema({ timestamps: { createdAt: true, updatedAt: false }, collection: "agent_turns" })
export class AgentTurnDoc {
  @Prop({ type: Types.ObjectId, required: true, index: true }) sessionId!: Types.ObjectId;
  @Prop({ type: String, required: true, enum: agent.AGENT_TURN_STATUSES }) status!: agent.AgentTurnStatus;
  @Prop({ type: [MongooseSchema.Types.Mixed], default: [] }) steps!: agent.AgentStep[];
  @Prop({ type: MongooseSchema.Types.Mixed, default: null }) pending!: PendingAction | null;
  @Prop({ required: true, default: 0 }) llmCalls!: number;
  @Prop({ type: Date, required: true, index: { expires: 0 } }) expiresAt!: Date;
  createdAt!: Date;
}
export const AgentTurnSchema = SchemaFactory.createForClass(AgentTurnDoc);
AgentTurnSchema.index({ createdAt: -1 });

/** Chamadas ao modelo por dia (UTC): protege a cota gratuita do provedor. */
@Schema({ collection: "agent_usage" })
export class AgentUsageDoc {
  @Prop({ type: String, required: true }) _id!: string;
  @Prop({ required: true, default: 0 }) calls!: number;
  @Prop({ type: Date, required: true, index: { expires: 0 } }) expiresAt!: Date;
}
export const AgentUsageSchema = SchemaFactory.createForClass(AgentUsageDoc);
