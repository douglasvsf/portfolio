import { HttpStatus } from "@nestjs/common";
import { ErpException } from "../erp/common/errors";

/**
 * Cliente do modelo de linguagem no formato "compatível com OpenAI"
 * (POST {base}/chat/completions com `tools`), que Groq, Gemini, OpenRouter e
 * outros oferecem. Trocar de provedor é trocar AI_BASE_URL, AI_API_KEY e
 * AI_MODEL — o agente não muda.
 */

export interface LlmToolCall {
  id: string;
  name: string;
  /** JSON em texto, como o modelo escreveu (pode vir inválido: quem chama valida). */
  arguments: string;
}

export type LlmMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: { id: string; type: "function"; function: { name: string; arguments: string } }[] }
  | { role: "tool"; tool_call_id: string; content: string };

export interface LlmTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface LlmReply {
  text: string | null;
  toolCalls: LlmToolCall[];
}

export interface LlmClient {
  complete(input: { system: string; messages: LlmMessage[]; tools: LlmTool[] }): Promise<LlmReply>;
}

export const LLM_CLIENT = Symbol("LLM_CLIENT");

const TIMEOUT_MS = 25_000;

interface ChatCompletion {
  choices?: { message?: { content?: string | null; tool_calls?: { id: string; function: { name: string; arguments: string } }[] } }[];
  error?: { message?: string };
}

const unavailable = (message: string) => new ErpException("service_unavailable", message, HttpStatus.SERVICE_UNAVAILABLE);

export class OpenAiCompatibleClient implements LlmClient {
  constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly model: string,
  ) {}

  async complete({ system, messages, tools }: { system: string; messages: LlmMessage[]; tools: LlmTool[] }): Promise<LlmReply> {
    // Tipo explícito no fetch: o `Response` global muda conforme quem confere os tipos (o build da Vercel não vê `ok`/`status`).
    const post = fetch as (url: string, init: object) => Promise<{ ok: boolean; status: number; json(): Promise<unknown> }>;
    let response: Awaited<ReturnType<typeof post>>;
    try {
      response = await post(`${this.baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { authorization: `Bearer ${this.apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({
          model: this.model,
          temperature: 0.2,
          max_tokens: 700,
          messages: [{ role: "system", content: system }, ...messages],
          tools: tools.map((tool) => ({ type: "function", function: tool })),
          tool_choice: "auto",
        }),
      });
    } catch {
      throw unavailable("O modelo de IA não respondeu a tempo. Tente de novo em instantes.");
    }
    const body = (await response.json().catch(() => ({}))) as ChatCompletion;
    if (response.status === 429) throw new ErpException("rate_limited", "O agente atingiu o limite gratuito do provedor de IA. Tente de novo mais tarde.", HttpStatus.TOO_MANY_REQUESTS);
    if (!response.ok) throw unavailable(`O provedor de IA recusou a chamada (HTTP ${response.status}).`);

    const message = body.choices?.[0]?.message;
    return {
      text: message?.content?.trim() || null,
      toolCalls: (message?.tool_calls ?? []).map((call) => ({ id: call.id, name: call.function.name, arguments: call.function.arguments || "{}" })),
    };
  }
}

/** Sem AI_* configurado: o agente responde 503 com mensagem clara (o resto da API segue). */
export class UnconfiguredClient implements LlmClient {
  complete(): Promise<LlmReply> {
    return Promise.reject(unavailable("Kaiju Agent indisponível: o modelo de IA não está configurado."));
  }
}

/**
 * Modelo roteirizado para os testes: devolve as respostas na ordem e guarda o
 * que recebeu. O laço do agente é testado de ponta a ponta sem rede nem cota.
 */
export class ScriptedLlm implements LlmClient {
  readonly calls: { system: string; messages: LlmMessage[]; tools: LlmTool[] }[] = [];
  private queue: (LlmReply | ((input: { messages: LlmMessage[] }) => LlmReply))[] = [];

  script(...replies: (LlmReply | ((input: { messages: LlmMessage[] }) => LlmReply))[]) {
    this.queue.push(...replies);
  }

  reset() {
    this.queue = [];
    this.calls.length = 0;
  }

  complete(input: { system: string; messages: LlmMessage[]; tools: LlmTool[] }): Promise<LlmReply> {
    this.calls.push(structuredClone(input));
    const next = this.queue.shift();
    if (!next) return Promise.resolve({ text: "Pronto.", toolCalls: [] });
    return Promise.resolve(typeof next === "function" ? next(input) : next);
  }
}

export const say = (text: string): LlmReply => ({ text, toolCalls: [] });
export const call = (name: string, args: unknown, id = `call_${name}_${Math.random().toString(36).slice(2, 8)}`): LlmReply => ({
  text: null,
  toolCalls: [{ id, name, arguments: JSON.stringify(args) }],
});
