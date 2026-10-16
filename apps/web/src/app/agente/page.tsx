import { Bot, Check, Clock, KeyRound, LogOut, ShieldCheck, Webhook } from "@godzilla/icons";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle, cn } from "@godzilla/ui";
import type { agent } from "@portfolio/shared";
import { Composer, ConfirmBar, ScrollAnchor, StartConversation } from "@/components/agent/interactive";
import { SUGGESTIONS } from "@/components/agent/suggestions";
import { timeLeft } from "@/lib/erp/format";
import { endConversation } from "@/lib/agent/actions";
import { getConversation } from "@/lib/agent/queries";

const FEATURES = [
  { icon: Webhook, title: "Ferramentas de verdade", text: "O agente chama as APIs do GODZILLA ERP e do GODZILLA Pay — busca produtos, cria pedidos, gera cobranças Pix — num mercado e numa loja só seus." },
  { icon: Check, title: "Você confirma", text: "Nada que muda dados roda sem o seu clique: o agente para, mostra o que quer fazer e espera. Recusou? Ele não insiste." },
  { icon: Clock, title: "Linha do tempo", text: "Cada chamada aparece com o que foi enviado, o que voltou e quanto demorou — dá para ver o raciocínio virar ação." },
  { icon: ShieldCheck, title: "Limites e segurança", text: "Parâmetros validados antes de executar, limite de passos e de mensagens, e dados das APIs tratados como dado — nunca como ordem." },
];

const STATUS: Record<agent.AgentToolStep["status"], { label: string; variant: "success" | "destructive" | "secondary" | "warning" }> = {
  ok: { label: "executada", variant: "success" },
  error: { label: "erro", variant: "destructive" },
  rejected: { label: "recusada", variant: "secondary" },
  awaiting_confirmation: { label: "aguardando você", variant: "warning" },
};

const json = (value: unknown) => JSON.stringify(value, null, 2);

function ToolChip({ step }: { step: agent.AgentToolStep }) {
  return (
    <p className="flex flex-wrap items-center gap-2 font-mono text-caption text-muted-foreground">
      <span className="rounded-sm border border-input px-1.5 py-0.5 uppercase">{step.system}</span>
      {step.label}
      <Badge variant={STATUS[step.status].variant}>{STATUS[step.status].label}</Badge>
    </p>
  );
}

function Turn({ turn }: { turn: agent.AgentTurn }) {
  return (
    <li className="flex flex-col gap-2" data-testid="agent-turn">
      {turn.steps.map((step) =>
        step.type === "text" ? (
          <p
            key={step.id}
            className={cn(
              "max-w-[85%] whitespace-pre-wrap rounded-lg px-4 py-2 text-body-sm",
              step.role === "user" ? "ml-auto rounded-br-sm bg-primary/15" : "rounded-bl-sm border border-border bg-card",
            )}
            data-role={step.role}
          >
            {step.text}
          </p>
        ) : (
          <ToolChip key={step.id} step={step} />
        ),
      )}
      {turn.pending && <ConfirmBar turnId={turn.id} label={turn.pending.label} />}
    </li>
  );
}

function Timeline({ turns }: { turns: agent.AgentTurn[] }) {
  const steps = turns.flatMap((turn) => turn.steps.filter((step): step is agent.AgentToolStep => step.type === "tool"));
  return (
    <Card className="h-fit min-w-0 lg:sticky lg:top-24">
      <CardHeader>
        <CardTitle as="h2" className="text-body font-semibold">
          Linha do tempo
        </CardTitle>
        <CardDescription>Cada ferramenta que o agente chamou, com o que enviou e o que voltou.</CardDescription>
      </CardHeader>
      <CardContent>
        {steps.length === 0 ? (
          <p className="text-body-sm text-muted-foreground">Nenhuma chamada ainda.</p>
        ) : (
          <ol className="flex flex-col gap-3 border-l-2 border-border pl-4" data-testid="agent-timeline">
            {steps.map((step) => (
              <li key={step.id} className="flex flex-col gap-1">
                <ToolChip step={step} />
                <span className="font-mono text-caption text-muted-foreground">
                  {step.tool}
                  {step.durationMs !== undefined && ` · ${step.durationMs} ms`}
                </span>
                {step.error && <p className="text-caption text-destructive">{step.error}</p>}
                <details className="text-caption">
                  <summary className="cursor-pointer font-mono text-muted-foreground hover:text-foreground">ver dados</summary>
                  <pre className="mt-2 max-h-64 overflow-auto rounded-md border border-input bg-background p-2 font-mono">{json({ enviado: step.args, ...(step.result !== undefined ? { recebido: step.result } : {}) })}</pre>
                </details>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}

export default async function AgentPage({ searchParams }: PageProps<"/agente">) {
  const { expirou } = await searchParams;
  const conversation = await getConversation();

  if (!conversation) {
    return (
      <div className="flex flex-col gap-12 py-8">
        <section className="flex max-w-3xl flex-col gap-5">
          <span className="font-mono text-body-sm text-primary">$ agent --kaiju</span>
          <h1 className="text-glow text-display font-black leading-tight tracking-tight">
            Kaiju <span className="text-primary">Agent</span>
          </h1>
          <p className="text-body-lg text-muted-foreground">
            Um agente de IA que opera o GODZILLA ERP e o GODZILLA Pay por você, em português: consulta o estoque, cria pedidos, gera cobranças Pix — e sempre
            pede a sua confirmação antes de mudar qualquer coisa.
          </p>
          {expirou && (
            <p role="status" className="text-body-sm text-warning">
              Sua conversa expirou ou foi encerrada. Comece outra.
            </p>
          )}
          <StartConversation />
          <p className="text-caption text-muted-foreground">
            Cada conversa ganha um mercado e uma loja de teste só seus. A IA roda num plano gratuito: se a cota do dia acabar, o agente avisa e volta amanhã.
          </p>
        </section>

        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <Card className="h-full">
                <CardHeader>
                  <Icon className="size-6 text-primary" aria-hidden="true" />
                  <CardTitle as="h2" className="text-body font-semibold">
                    {title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{text}</CardDescription>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>

        <section className="flex flex-col gap-3" aria-labelledby="exemplos">
          <h2 id="exemplos" className="font-mono text-overline uppercase tracking-widest text-primary">
            Experimente pedir
          </h2>
          <ul className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <li key={suggestion} className="rounded-full border border-input px-3 py-1 font-mono text-caption text-muted-foreground">
                {suggestion}
              </li>
            ))}
          </ul>
        </section>
      </div>
    );
  }

  const { session, turns } = conversation;
  const waiting = turns.some((turn) => turn.status === "awaiting_confirmation");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="flex items-center gap-2 text-h3 font-bold">
            <Bot className="size-6 text-primary" aria-hidden="true" />
            Kaiju Agent
          </h1>
          <p className="font-mono text-caption text-muted-foreground" data-testid="agent-session">
            {session.erp.workspaceName}
            {session.pay ? ` · ${session.pay.merchantName}` : " · Pay indisponível"} · {session.turnsLeft} mensagens restantes · expira em {timeLeft(session.expiresAt)}
          </p>
        </div>
        <form action={endConversation}>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-sm font-mono text-caption text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-2 focus-visible:outline-primary"
          >
            <LogOut className="size-3.5" aria-hidden="true" />
            Encerrar conversa
          </button>
        </form>
      </div>

      {/* minmax(0,…) também no celular: sem isso o JSON da linha do tempo estica a coluna além da tela. */}
      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Card className="flex min-w-0 flex-col gap-4 p-4 sm:p-6">
          <ul className="flex flex-col gap-5" aria-live="polite" data-testid="agent-chat">
            <li>
              <p className="max-w-[85%] rounded-lg rounded-bl-sm border border-border bg-card px-4 py-2 text-body-sm">
                Oi! Sou o Kaiju Agent. Cuido do <strong>{session.erp.workspaceName}</strong>
                {session.pay ? (
                  <>
                    {" "}
                    e da <strong>{session.pay.merchantName}</strong>
                  </>
                ) : null}
                . Peça uma consulta ou uma ação — antes de mudar qualquer dado, eu pergunto.
              </p>
            </li>
            {turns.map((turn) => (
              <Turn key={turn.id} turn={turn} />
            ))}
          </ul>
          <ScrollAnchor count={turns.length + turns.reduce((total, turn) => total + turn.steps.length, 0)} />
          <Composer
            disabled={waiting || session.turnsLeft === 0}
            disabledReason={waiting ? "Confirme ou recuse a ação acima para continuar." : "Esta conversa chegou ao limite. Encerre e comece outra."}
          />
          <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
            <KeyRound className="size-3.5" aria-hidden="true" />O agente usa só as ferramentas desta página; não acessa nada fora do seu mercado e da sua loja.
          </p>
        </Card>
        <Timeline turns={turns} />
      </div>
    </div>
  );
}
