"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { ArrowRight, Check, Copy, Eye, EyeOff, RefreshCw, Undo2 } from "@godzilla/icons";
import { Button, FormField, Input, Spinner, cn } from "@godzilla/ui";
import { pay } from "@portfolio/shared";
import { MaskedInput } from "@/components/erp/masked-input";
import { FormMessage, selectClassName } from "@/components/erp/ui";
import { IDLE, type ActionState } from "@/lib/erp/action-state";
import { createCharge, createSandbox, refundCharge, retryDelivery, saveWebhookSettings, simulatePayment } from "@/lib/pay/actions";

/** Partes interativas das telas do Pay. */

const errorsOf = (state: ActionState) => (state.status === "error" ? (state.fieldErrors ?? {}) : {});

export function SandboxEntry() {
  const [state, action, pending] = useActionState(createSandbox, IDLE);
  return (
    <form action={action} className="flex flex-col gap-3">
      <Button type="submit" size="lg" disabled={pending} className="w-fit font-mono font-semibold hover:shadow-glow">
        {pending ? <Spinner size="sm" /> : null}
        {pending ? "Criando sua loja…" : "Criar minha loja de teste"}
        {!pending && <ArrowRight aria-hidden="true" />}
      </Button>
      <FormMessage state={state} />
    </form>
  );
}

const EXPIRATIONS = [
  { value: 300, label: "5 minutos" },
  { value: 900, label: "15 minutos" },
  { value: 3600, label: "1 hora" },
  { value: 86_400, label: "24 horas" },
];

/** Nova cobrança. A Idempotency-Key nasce com a tela: enviar duas vezes devolve a mesma cobrança. */
export function ChargeForm({ idempotencyKey }: { idempotencyKey: string }) {
  const [state, action, pending] = useActionState(createCharge, IDLE);
  const errors = errorsOf(state);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate data-testid="charge-form">
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Valor (R$)" error={errors.amount} required>
          <MaskedInput mask="money" name="amount" inputMode="numeric" placeholder="0,00" autoComplete="off" />
        </FormField>
        <FormField label="Validade do Pix">
          <select name="expiresIn" defaultValue={3600} className={selectClassName}>
            {EXPIRATIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <FormField label="Descrição" error={errors.description} optional>
        <Input name="description" maxLength={pay.PAY_LIMITS.description} placeholder="Ex.: Pedido 1042" />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Nome do pagador" error={errors.customerName} optional>
          <Input name="customerName" maxLength={pay.PAY_LIMITS.customerName} autoComplete="off" />
        </FormField>
        <FormField label="CPF ou CNPJ" error={errors.customerDocument} optional>
          <MaskedInput mask="document" name="customerDocument" inputMode="numeric" autoComplete="off" />
        </FormField>
      </div>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Gerando Pix…" : "Gerar cobrança Pix"}
      </Button>
    </form>
  );
}

export function SimulatePaymentButton({ chargeId }: { chargeId: string }) {
  const [state, setState] = useState<ActionState>(IDLE);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col gap-2">
      <Button type="button" size="lg" disabled={pending} onClick={() => start(async () => setState(await simulatePayment(chargeId)))} className="w-full font-mono font-semibold">
        {pending ? <Spinner size="sm" /> : <Check aria-hidden="true" />}
        {pending ? "Confirmando…" : "Simular pagamento"}
      </Button>
      <FormMessage state={state} />
    </div>
  );
}

export function RefundForm({ chargeId, remainingCents, idempotencyKey }: { chargeId: string; remainingCents: number; idempotencyKey: string }) {
  const [state, action, pending] = useActionState(refundCharge.bind(null, chargeId), IDLE);
  const errors = errorsOf(state);
  return (
    <form action={action} className="flex flex-col gap-3" noValidate data-testid="refund-form">
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      <FormField label="Valor do estorno (R$)" error={errors.amount} description={`Em branco estorna tudo o que resta (${(remainingCents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}). A taxa não volta.`}>
        <MaskedInput mask="money" name="amount" inputMode="numeric" placeholder="0,00" autoComplete="off" />
      </FormField>
      <FormMessage state={state} />
      <Button type="submit" variant="outline" disabled={pending} className="w-fit">
        <Undo2 aria-hidden="true" />
        {pending ? "Estornando…" : "Estornar"}
      </Button>
    </form>
  );
}

export function CopyButton({ value, label = "Copiar" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
    >
      {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
      {copied ? "Copiado" : label}
    </Button>
  );
}

/** Segredo mascarado, com mostrar e copiar. */
export function SecretValue({ value, label }: { value: string; label: string }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      <span className="text-body-sm font-medium">{label}</span>
      <div className="flex flex-wrap items-center gap-2">
        <code className="min-w-0 flex-1 break-all rounded-md border border-input bg-background px-3 py-2 font-mono text-caption" data-testid={`secret-${label}`}>
          {visible ? value : `${value.slice(0, 12)}${"•".repeat(20)}`}
        </code>
        <Button type="button" variant="ghost" size="sm" onClick={() => setVisible(!visible)} aria-pressed={visible}>
          {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          {visible ? "Ocultar" : "Mostrar"}
        </Button>
        <CopyButton value={value} />
      </div>
    </div>
  );
}

/** Contagem regressiva do Pix; ao zerar, recarrega para a cobrança aparecer como expirada. */
export function ExpiresCountdown({ expiresAt }: { expiresAt: string }) {
  const router = useRouter();
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, []);
  const left = now === null ? null : Math.max(0, Math.floor((new Date(expiresAt).getTime() - now) / 1000));
  useEffect(() => {
    if (left === 0) router.refresh();
  }, [left, router]);
  if (left === null) return null;
  const hours = Math.floor(left / 3600);
  const minutes = Math.floor((left % 3600) / 60);
  const seconds = String(left % 60).padStart(2, "0");
  return (
    <span className="font-mono tabular-nums" aria-live="off">
      {hours > 0 ? `${hours}h ${String(minutes).padStart(2, "0")}min` : `${minutes}:${seconds}`}
    </span>
  );
}

/** Enquanto há entrega agendada, a tela se atualiza sozinha para mostrar as novas tentativas. */
export function AutoRefresh({ active, seconds = 5 }: { active: boolean; seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => router.refresh(), seconds * 1000);
    return () => clearInterval(timer);
  }, [active, seconds, router]);
  if (!active) return null;
  return (
    <span className="inline-flex items-center gap-1.5 font-mono text-caption text-muted-foreground">
      <RefreshCw className="size-3.5 animate-spin [animation-duration:3s]" aria-hidden="true" />
      atualizando a cada {seconds}s
    </span>
  );
}

export function RetryButton({ deliveryId }: { deliveryId: string }) {
  const [state, setState] = useState<ActionState>(IDLE);
  const [pending, start] = useTransition();
  return (
    <div className="flex flex-col items-start gap-1">
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => start(async () => setState(await retryDelivery(deliveryId)))}>
        <RefreshCw aria-hidden="true" />
        {pending ? "Reenviando…" : "Reenviar agora"}
      </Button>
      <FormMessage state={state} />
    </div>
  );
}

export function WebhookSettingsForm({ merchant }: { merchant: pay.Merchant }) {
  const [state, action, pending] = useActionState(saveWebhookSettings, IDLE);
  const [destination, setDestination] = useState(merchant.webhookUrl ? "url" : "inspector");
  const errors = errorsOf(state);
  return (
    <form action={action} className="flex flex-col gap-4" noValidate data-testid="webhook-settings">
      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-body-sm font-medium">Destino dos webhooks</legend>
        {[
          { value: "inspector", label: "Inspetor da loja", hint: "mostra aqui embaixo tudo o que chegou" },
          { value: "url", label: "Minha URL", hint: "https pública, ex.: webhook.site" },
        ].map((option) => (
          <label key={option.value} className="flex items-start gap-2 text-body-sm">
            <input type="radio" name="destination" value={option.value} checked={destination === option.value} onChange={() => setDestination(option.value)} className="mt-1 accent-primary" />
            <span className="flex flex-col">
              {option.label}
              <span className="text-caption text-muted-foreground">{option.hint}</span>
            </span>
          </label>
        ))}
      </fieldset>
      {destination === "url" && (
        <FormField label="URL" error={errors.url} required>
          <Input name="url" type="url" defaultValue={merchant.webhookUrl ?? ""} placeholder="https://webhook.site/..." maxLength={500} />
        </FormField>
      )}
      <FormField label="Simular destino fora do ar" description="O inspetor recusa (HTTP 500) as próximas entregas — veja as novas tentativas acontecendo.">
        <select name="failNext" defaultValue={merchant.inspectorFailNext} className={cn(selectClassName, "sm:w-64")}>
          {[0, 1, 2, 3, 4, 5].map((count) => (
            <option key={count} value={count}>
              {count === 0 ? "Não, responder 200" : `Recusar as próximas ${count}`}
            </option>
          ))}
        </select>
      </FormField>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Salvando…" : "Salvar"}
      </Button>
    </form>
  );
}
