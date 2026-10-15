import { HttpStatus } from "@nestjs/common";
import { z } from "zod";
import { erp, pay, type agent } from "@portfolio/shared";
import type { CatalogService } from "../erp/catalog/catalog.service";
import type { ErpSession } from "../erp/common/auth";
import { ErpException } from "../erp/common/errors";
import type { DashboardService } from "../erp/dashboard/dashboard.service";
import type { OrdersService } from "../erp/orders/orders.service";
import type { ChargesService } from "../pay/charges.service";
import type { MerchantRow } from "../pay/merchants";
import type { LlmTool } from "./llm";

/**
 * Ferramentas do Kaiju Agent: cada uma chama um serviço de verdade do ERP ou
 * do Pay, com a empresa/loja do visitante. Os parâmetros são validados com
 * Zod (o mesmo schema gera o JSON Schema que o modelo recebe). As que mudam
 * dados têm `mutates: true` — o agente para e espera a pessoa confirmar.
 *
 * O resultado volta para o modelo compacto (sem campos internos), para gastar
 * menos tokens e não expor o que não precisa.
 */

export interface ToolContext {
  erp: ErpSession;
  merchant: MerchantRow | null;
  /** Chave de idempotência estável por passo: confirmar duas vezes não cobra duas vezes. */
  idempotencyKey: string;
  services: { catalog: CatalogService; dashboard: DashboardService; orders: OrdersService; charges: ChargesService };
}

export interface AgentTool<Schema extends z.ZodType = z.ZodType> {
  name: string;
  system: agent.AgentSystem;
  description: string;
  schema: Schema;
  mutates: boolean;
  label: (args: z.output<Schema>) => string;
  run: (context: ToolContext, args: z.output<Schema>) => Promise<unknown>;
}

const brl = (cents: number) => (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const id = z.string().regex(/^[a-f\d]{24}$/i, "id inválido");
const uuid = z.uuid({ error: "id de cobrança inválido" });

function requirePay(context: ToolContext): MerchantRow {
  if (!context.merchant) throw new ErpException("service_unavailable", "O GODZILLA Pay está indisponível agora.", HttpStatus.SERVICE_UNAVAILABLE);
  return context.merchant;
}

const product = (item: erp.Product) => ({ id: item.id, nome: item.name, sku: item.sku, preco: brl(item.priceCents), estoque: item.stock, estoqueMinimo: item.minStock, unidade: item.unit });
const charge = (item: pay.Charge) => ({
  id: item.id,
  situacao: pay.CHARGE_STATUS_LABELS[item.status],
  valor: brl(item.amountCents),
  valorCentavos: item.amountCents,
  estornado: brl(item.refundedCents),
  descricao: item.description,
  criadaEm: item.createdAt,
});

const define = <Schema extends z.ZodType>(tool: AgentTool<Schema>) => tool as unknown as AgentTool;

export const AGENT_TOOLS: AgentTool[] = [
  define({
    name: "erp_buscar_produtos",
    system: "erp",
    description: "Busca produtos do mercado (nome, SKU, preço e estoque). Use estoqueBaixo=true para os que estão abaixo do estoque mínimo.",
    schema: z.object({ busca: z.string().trim().max(60).optional(), estoqueBaixo: z.boolean().optional() }),
    mutates: false,
    label: (args) => (args.estoqueBaixo ? "Buscar produtos com estoque baixo" : args.busca ? `Buscar produtos: "${args.busca}"` : "Listar produtos"),
    run: async ({ erp: session, services }, args) => {
      const page = await services.catalog.listProducts(session, { page: 1, pageSize: 10, search: args.busca || undefined, lowStock: args.estoqueBaixo || undefined });
      return { total: page.total, produtos: page.items.map(product) };
    },
  }),
  define({
    name: "erp_buscar_clientes",
    system: "erp",
    description: "Busca clientes do mercado pelo nome. Use para achar o id do cliente antes de criar um pedido.",
    schema: z.object({ busca: z.string().trim().max(60).optional() }),
    mutates: false,
    label: (args) => (args.busca ? `Buscar clientes: "${args.busca}"` : "Listar clientes"),
    run: async ({ erp: session, services }, args) => {
      const page = await services.catalog.listCustomers(session, { page: 1, pageSize: 10, search: args.busca || undefined });
      return { total: page.total, clientes: page.items.map((item) => ({ id: item.id, nome: item.name })) };
    },
  }),
  define({
    name: "erp_resumo_vendas",
    system: "erp",
    description: "Resumo do mercado: faturamento do mês, ticket médio, produtos mais vendidos e produtos com estoque baixo.",
    schema: z.object({}),
    mutates: false,
    label: () => "Ver o resumo de vendas",
    run: async ({ erp: session, services }) => {
      const summary = await services.dashboard.summary(session);
      return {
        faturamentoDoMes: brl(summary.currentMonthCents),
        ticketMedio: brl(summary.averageTicketCents),
        pedidos: summary.ordersByStatus,
        maisVendidos: summary.topProducts.slice(0, 5).map((item) => ({ nome: item.name, faturamento: brl(item.revenueCents) })),
        estoqueBaixo: summary.lowStock.slice(0, 8).map((item) => ({ id: item.productId, nome: item.name, estoque: item.stock, estoqueMinimo: item.minStock })),
      };
    },
  }),
  define({
    name: "erp_criar_pedido",
    system: "erp",
    description: "Cria e confirma um pedido de venda para um cliente (baixa o estoque). Precisa do id do cliente e dos ids dos produtos.",
    schema: z.object({
      clienteId: id,
      itens: z.array(z.object({ produtoId: id, quantidade: z.number().positive().max(1000) })).min(1).max(20),
    }),
    mutates: true,
    label: (args) => `Criar e confirmar pedido com ${args.itens.length} ${args.itens.length === 1 ? "item" : "itens"}`,
    run: async ({ erp: session, services }, args) => {
      const input = erp.orderInputSchema.parse({ customerId: args.clienteId, items: args.itens.map((item) => ({ productId: item.produtoId, quantity: item.quantidade })) });
      const draft = await services.orders.create(session, input);
      const order = await services.orders.confirm(session, draft.id);
      return { numero: order.number, situacao: order.status, total: brl(order.totalCents), cliente: order.customer?.name, itens: order.items.map((item) => `${item.quantity} ${item.unit} ${item.name}`) };
    },
  }),
  define({
    name: "pay_saldo",
    system: "pay",
    description: "Saldo da loja no GODZILLA Pay, calculado do livro-caixa: disponível, recebido, taxas e estornado.",
    schema: z.object({}),
    mutates: false,
    label: () => "Ver o saldo da loja",
    run: async (context) => {
      const balance = await context.services.charges.balance(requirePay(context));
      return { disponivel: brl(balance.availableCents), recebido: brl(balance.grossCents), taxas: brl(balance.feesCents), estornado: brl(balance.refundedCents), livroCaixaBalanceado: balance.ledgerBalanced };
    },
  }),
  define({
    name: "pay_listar_cobrancas",
    system: "pay",
    description: "Lista as cobranças Pix mais recentes da loja, opcionalmente por situação.",
    schema: z.object({ situacao: z.enum(pay.CHARGE_STATUSES).optional() }),
    mutates: false,
    label: (args) => (args.situacao ? `Listar cobranças: ${pay.CHARGE_STATUS_LABELS[args.situacao as pay.ChargeStatus].toLowerCase()}` : "Listar cobranças"),
    run: async (context, args) => {
      const page = await context.services.charges.list(requirePay(context), { status: args.situacao, page: 1, pageSize: 10 });
      return { total: page.total, cobrancas: page.items.map(charge) };
    },
  }),
  define({
    name: "pay_criar_cobranca",
    system: "pay",
    description: "Cria uma cobrança Pix (gera o QR Code e o copia e cola). Valor em centavos: R$ 50,00 = 5000.",
    schema: z.object({ valorCentavos: z.number().int().min(pay.PAY_LIMITS.minAmount).max(pay.PAY_LIMITS.maxAmount), descricao: z.string().trim().max(pay.PAY_LIMITS.description).optional() }),
    mutates: true,
    label: (args) => `Criar cobrança Pix de ${brl(args.valorCentavos)}${args.descricao ? ` — ${args.descricao}` : ""}`,
    run: async (context, args) => {
      const result = await context.services.charges.create(requirePay(context), pay.chargeCreateSchema.parse({ amountCents: args.valorCentavos, description: args.descricao }), context.idempotencyKey);
      return { ...charge(result.body), pixCopiaECola: result.body.brCode };
    },
  }),
  define({
    name: "pay_simular_pagamento",
    system: "pay",
    description: "Ambiente de teste: simula que o pagador pagou o Pix de uma cobrança pendente.",
    schema: z.object({ cobrancaId: uuid }),
    mutates: true,
    label: () => "Simular o pagamento do Pix",
    run: async (context, args) => charge(await context.services.charges.simulatePayment(requirePay(context), args.cobrancaId)),
  }),
  define({
    name: "pay_estornar",
    system: "pay",
    description: "Estorna uma cobrança paga: sem valor estorna tudo o que resta; com valorCentavos, estorno parcial.",
    schema: z.object({ cobrancaId: uuid, valorCentavos: z.number().int().min(1).max(pay.PAY_LIMITS.maxAmount).optional() }),
    mutates: true,
    label: (args) => (args.valorCentavos ? `Estornar ${brl(args.valorCentavos)}` : "Estornar o valor restante da cobrança"),
    run: async (context, args) => {
      const result = await context.services.charges.refund(requirePay(context), args.cobrancaId, { amountCents: args.valorCentavos }, context.idempotencyKey);
      return charge(result.body);
    },
  }),
];

export const TOOLS_BY_NAME = new Map(AGENT_TOOLS.map((tool) => [tool.name, tool]));

/** Definições no formato que o modelo recebe (JSON Schema gerado do Zod). */
export function llmTools(available: { pay: boolean }): LlmTool[] {
  return AGENT_TOOLS.filter((tool) => tool.system !== "pay" || available.pay).map((tool) => {
    const parameters = z.toJSONSchema(tool.schema, { io: "input" }) as Record<string, unknown>;
    delete parameters.$schema; // alguns provedores recusam a chave $schema
    return { name: tool.name, description: tool.description, parameters };
  });
}
