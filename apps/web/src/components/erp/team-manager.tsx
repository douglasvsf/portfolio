"use client";

import { useActionState, useState, useTransition } from "react";
import { Check, KeyRound, Lock, MessageCircle } from "@godzilla/icons";
import { Badge, Button, FormField, Input, cn } from "@godzilla/ui";
import { erp } from "@portfolio/shared";
import { createCompany, createInvite, createResetLink, revokeInvite, updateMember, type LinkState } from "@/lib/erp/account-actions";
import { IDLE, type ActionState } from "@/lib/erp/action-state";
import { formatDateTime } from "@/lib/erp/format";
import { MAX_LENGTH } from "@/lib/erp/masks";
import { FormMessage, selectClassName } from "./ui";

type Scope = "team" | "owner";

/**
 * Gestão de acesso: convites, papel, bloqueio e link de senha. O mesmo
 * componente serve a Equipe (administrador, só a própria empresa) e o painel
 * do dono (todas as empresas) — muda só o `scope` que vai para a API.
 */

/** Link gerado (convite ou senha): copiar ou mandar pelo WhatsApp. Aparece uma vez só. */
export function LinkBox({ state }: { state: LinkState }) {
  const [copied, setCopied] = useState(false);
  if (state.status !== "success" || !("link" in state)) return <FormMessage state={state} />;
  const copy = async () => {
    await navigator.clipboard.writeText(state.link);
    setCopied(true);
  };
  return (
    <div role="status" className="flex flex-col gap-2 rounded-md border border-primary/40 bg-primary/5 p-3 text-body-sm">
      <p>{state.message}</p>
      <Input value={state.link} readOnly aria-label="Link gerado" className="font-mono text-caption" onFocus={(event) => event.currentTarget.select()} />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" onClick={copy}>
          {copied ? <Check aria-hidden="true" /> : null}
          {copied ? "Copiado" : "Copiar link"}
        </Button>
        <Button asChild size="sm" variant="outline">
          <a href={`https://wa.me/?text=${encodeURIComponent(`Seu acesso ao GODZILLA ERP: ${state.link}`)}`} target="_blank" rel="noopener noreferrer">
            <MessageCircle aria-hidden="true" /> Enviar pelo WhatsApp
          </a>
        </Button>
        <span className="text-caption text-muted-foreground">Vale até {formatDateTime(state.expiresAt)}. Depois de usado, não funciona mais.</span>
      </div>
    </div>
  );
}

export function InviteForm({ scope, companies }: { scope: Scope; companies?: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createInvite.bind(null, scope), IDLE as LinkState);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  return (
    <form action={action} className="flex flex-col gap-3" noValidate key={state.status === "success" ? state.message : "invite"}>
      <div className={cn("grid gap-3", companies ? "sm:grid-cols-[1fr_1fr_auto]" : "sm:grid-cols-[1fr_auto]")}>
        {companies && (
          <FormField label="Empresa" error={errors.workspaceId} required>
            <select name="workspaceId" className={selectClassName} defaultValue={companies[0]?.id}>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          </FormField>
        )}
        <FormField label="E-mail da pessoa" error={errors.email} required>
          <Input name="email" type="email" autoComplete="off" maxLength={MAX_LENGTH.email} />
        </FormField>
        <FormField label="Papel" required>
          <select name="role" className={selectClassName} defaultValue="seller">
            {erp.ROLES.map((role) => (
              <option key={role} value={role}>
                {erp.ROLE_LABELS[role]}
              </option>
            ))}
          </select>
        </FormField>
      </div>
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Gerando…" : "Gerar convite"}
      </Button>
      <LinkBox state={state} />
    </form>
  );
}

export function MemberActions({ scope, member }: { scope: Scope; member: erp.TeamMember }) {
  const [state, setState] = useState<LinkState>(IDLE);
  const [pending, startTransition] = useTransition();
  const run = (work: () => Promise<LinkState>) => startTransition(async () => setState(await work()));

  if (member.isOwner) return <Badge variant="outline">Dono do sistema</Badge>;
  const blocked = member.status === "blocked";
  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <select
          aria-label={`Papel de ${member.name}`}
          value={member.role}
          disabled={pending}
          onChange={(event) => run(() => updateMember(scope, member.id, { role: event.target.value as erp.Role }))}
          className={cn(selectClassName, "h-8 w-auto text-caption")}
        >
          {erp.ROLES.map((role) => (
            <option key={role} value={role}>
              {erp.ROLE_LABELS[role]}
            </option>
          ))}
        </select>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => run(() => createResetLink(scope, member.id))}
          aria-label={`Gerar link de senha para ${member.name}`}
        >
          <KeyRound aria-hidden="true" /> Senha
        </Button>
        <Button
          type="button"
          size="sm"
          variant={blocked ? "outline" : "ghost"}
          disabled={pending}
          onClick={() => run(() => updateMember(scope, member.id, { status: blocked ? "active" : "blocked" }))}
          className={blocked ? undefined : "text-muted-foreground hover:text-destructive"}
        >
          <Lock aria-hidden="true" /> {blocked ? "Desbloquear" : "Bloquear"}
          <span className="sr-only"> {member.name}</span>
        </Button>
      </div>
      {state.status !== "idle" && (
        <div className="w-full max-w-xl text-left">
          <LinkBox state={state} />
        </div>
      )}
    </div>
  );
}

export function RevokeInvite({ scope, invite }: { scope: Scope; invite: erp.Invite }) {
  const [state, setState] = useState<ActionState>(IDLE);
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex flex-col items-end gap-1">
      <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => startTransition(async () => setState(await revokeInvite(scope, invite.id)))}>
        Cancelar convite<span className="sr-only"> de {invite.email}</span>
      </Button>
      {state.status === "error" && <FormMessage state={state} />}
    </div>
  );
}

export function CompanyForm() {
  const [state, action, pending] = useActionState(createCompany, IDLE);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  return (
    <form action={action} className="flex flex-col gap-3" noValidate key={state.status === "success" ? state.message : "company"}>
      <div className="flex flex-wrap items-end gap-3">
        <FormField label="Nome da empresa" error={errors.name} required className="min-w-64 flex-1">
          <Input name="name" maxLength={60} />
        </FormField>
        <Button type="submit" disabled={pending}>
          {pending ? "Criando…" : "Criar empresa"}
        </Button>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
