import type { LlmClient, LlmMessage, LlmReply } from "./llm";

/**
 * "Cérebro" por regras para o E2E do site (AI_PROVIDER=rules): reconhece
 * alguns pedidos fixos e chama as ferramentas de verdade, sem rede nem chave.
 * NUNCA é usado em produção (o módulo só aceita fora de NODE_ENV=production).
 */

const toCents = (text: string) => Math.round(Number(text.replace(/\./g, "").replace(",", ".")) * 100);
const parse = (content: string) => {
  try {
    return JSON.parse(content) as { resultado?: Record<string, unknown>; erro?: string };
  } catch {
    return {};
  }
};

let counter = 0;
const call = (name: string, args: unknown): LlmReply => ({ text: null, toolCalls: [{ id: `rules_${++counter}`, name, arguments: JSON.stringify(args) }] });
const say = (text: string): LlmReply => ({ text, toolCalls: [] });

export class RuleBasedLlm implements LlmClient {
  complete({ messages }: { messages: LlmMessage[] }): Promise<LlmReply> {
    return Promise.resolve(this.reply(messages));
  }

  private reply(messages: LlmMessage[]): LlmReply {
    const last = messages.at(-1);
    if (last?.role === "tool") {
      const { resultado, erro } = parse(last.content);
      if (erro) return say(`Não deu certo: ${erro}`);
      const calledBy = [...messages].reverse().find((message) => message.role === "assistant" && "tool_calls" in message && message.tool_calls?.length);
      const tool = calledBy && "tool_calls" in calledBy ? calledBy.tool_calls![0]!.function.name : "";
      if (tool === "erp_buscar_produtos") {
        const produtos = (resultado?.produtos ?? []) as { nome: string }[];
        return say(`Encontrei ${resultado?.total ?? produtos.length} produtos com estoque baixo, como ${produtos.slice(0, 3).map((item) => item.nome).join(", ")}.`);
      }
      if (tool === "pay_criar_cobranca") return say(`Cobrança criada: ${resultado?.valor}. O Pix já pode ser pago.`);
      if (tool === "pay_saldo") return say(`Saldo disponível: ${resultado?.disponivel}.`);
      return say("Feito.");
    }

    const text = last?.role === "user" ? last.content.toLowerCase() : "";
    if (/estoque baixo/.test(text)) return call("erp_buscar_produtos", { estoqueBaixo: true });
    const amount = /cobran[çc]a de r\$\s*([\d.,]+)/.exec(text);
    if (amount) return call("pay_criar_cobranca", { valorCentavos: toCents(amount[1]!), descricao: "Pedido pelo Kaiju Agent" });
    if (/saldo/.test(text)) return call("pay_saldo", {});
    return say("Sou o cérebro de testes do Kaiju Agent: entendo estoque baixo, cobrança de R$ e saldo.");
  }
}
