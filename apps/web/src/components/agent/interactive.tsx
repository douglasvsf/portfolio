"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { ArrowRight, Check, X } from "@godzilla/icons";
import { Button, Spinner, cn } from "@godzilla/ui";
import { agent } from "@portfolio/shared";
import { confirmAction, sendMessage, startConversation, type AgentActionState } from "@/lib/agent/actions";
import { SUGGESTIONS } from "./suggestions";

/** Partes interativas da tela do Kaiju Agent. */

const IDLE: AgentActionState = { status: "idle" };

function ErrorLine({ state }: { state: AgentActionState }) {
  if (state.status !== "error") return null;
  return (
    <p role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-body-sm text-destructive">
      {state.message}
    </p>
  );
}

export function StartConversation() {
  const [state, action, pending] = useActionState(startConversation, IDLE);
  return (
    <form action={action} className="flex flex-col gap-3">
      <Button type="submit" size="lg" disabled={pending} className="w-fit font-mono font-semibold hover:shadow-glow">
        {pending ? <Spinner size="sm" /> : null}
        {pending ? "Preparando seu mercado e sua loja…" : "Começar conversa"}
        {!pending && <ArrowRight aria-hidden="true" />}
      </Button>
      <ErrorLine state={state} />
    </form>
  );
}

/** Campo de mensagem. Enquanto o agente trabalha, mostra a mensagem enviada e "pensando". */
export function Composer({ disabled, disabledReason }: { disabled: boolean; disabledReason?: string }) {
  const [state, action, pending] = useActionState(sendMessage, IDLE);
  const [text, setText] = useState("");
  const [sent, setSent] = useState("");
  const draft = state.status === "error" ? state.draft : undefined;
  const value = draft !== undefined && text === "" && !pending ? draft : text;

  return (
    <div className="flex flex-col gap-3">
      {pending && (
        <div className="flex flex-col gap-2" aria-live="polite">
          <p className="ml-auto max-w-[85%] rounded-lg rounded-br-sm bg-primary/15 px-4 py-2 text-body-sm">{sent}</p>
          <p className="flex items-center gap-2 font-mono text-caption text-muted-foreground">
            <Spinner size="sm" /> Kaiju pensando e chamando as ferramentas…
          </p>
        </div>
      )}
      <ErrorLine state={state} />
      <form
        action={(form) => {
          setSent(String(form.get("message") ?? ""));
          setText("");
          return action(form);
        }}
        className="flex flex-col gap-2"
        data-testid="agent-composer"
      >
        <label htmlFor="agent-message" className="sr-only">
          Mensagem para o Kaiju Agent
        </label>
        <div className="flex items-end gap-2">
          <textarea
            id="agent-message"
            name="message"
            rows={2}
            maxLength={agent.AGENT_LIMITS.message}
            value={value}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            disabled={disabled || pending}
            placeholder={disabled ? disabledReason : "Peça algo para o mercado ou para a loja…"}
            className="min-h-12 flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-body-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          />
          <Button type="submit" disabled={disabled || pending || !value.trim()} className="h-12">
            Enviar
          </Button>
        </div>
        {!disabled && !pending && (
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => setText(suggestion)}
                className="rounded-full border border-input px-3 py-1 font-mono text-caption text-muted-foreground transition-colors hover:border-primary hover:text-primary"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </form>
    </div>
  );
}

/** A ação que o agente deixou esperando: só roda se a pessoa confirmar. */
export function ConfirmBar({ turnId, label }: { turnId: string; label: string }) {
  const [state, setState] = useState<AgentActionState>(IDLE);
  const [pending, start] = useTransition();
  const [choice, setChoice] = useState<boolean | null>(null);
  const decide = (approve: boolean) => {
    setChoice(approve);
    start(async () => setState(await confirmAction(turnId, approve)));
  };
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-warning/60 bg-warning/10 p-4" data-testid="agent-confirm">
      <p className="text-body-sm">
        <span className="font-semibold">O agente quer:</span> {label}
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={pending} onClick={() => decide(true)}>
          {pending && choice ? <Spinner size="sm" /> : <Check aria-hidden="true" />}
          Confirmar
        </Button>
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => decide(false)}>
          <X aria-hidden="true" />
          Recusar
        </Button>
      </div>
      <ErrorLine state={state} />
    </div>
  );
}

/** Desce até o fim da conversa quando chega coisa nova. */
export function ScrollAnchor({ count }: { count: number }) {
  const anchor = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (count > 0) anchor.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [count]);
  return <div ref={anchor} className={cn("h-px")} aria-hidden="true" />;
}
