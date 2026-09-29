"use client";

import { useActionState, useState, useTransition } from "react";
import { Button, Card, FormField, Input, cn } from "@godzilla/ui";
import { erp } from "@portfolio/shared";
import { approveRequest, rejectRequest, requestAccess, type LinkState } from "@/lib/erp/account-actions";
import { IDLE, type ActionState } from "@/lib/erp/action-state";
import { formatDateTime } from "@/lib/erp/format";
import { MAX_LENGTH } from "@/lib/erp/masks";
import { LinkBox } from "./team-manager";
import { FormMessage, selectClassName } from "./ui";

/** Formulário público. O campo "website" é armadilha para robôs: invisível e fora da ordem de tabulação. */
export function AccessRequestForm() {
  const [state, action, pending] = useActionState(requestAccess, IDLE);
  const errors = state.status === "error" ? (state.fieldErrors ?? {}) : {};
  if (state.status === "success") return <FormMessage state={state} />;
  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <FormField label="Seu nome" error={errors.name} required>
        <Input name="name" autoComplete="name" maxLength={80} />
      </FormField>
      <FormField label="E-mail" error={errors.email} required description="Vai ser o seu login se o acesso for aprovado.">
        <Input name="email" type="email" autoComplete="email" maxLength={MAX_LENGTH.email} />
      </FormField>
      <FormField label="Empresa / mercado" error={errors.company} optional>
        <Input name="company" autoComplete="organization" maxLength={60} />
      </FormField>
      <FormField label="Mensagem" error={errors.message} optional>
        <textarea name="message" rows={3} maxLength={500} placeholder="Conte rapidamente para que você quer usar o sistema." className={cn(selectClassName, "h-auto py-2")} />
      </FormField>
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label>
          Site
          <input name="website" type="text" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <FormMessage state={state} />
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Enviando…" : "Enviar pedido"}
      </Button>
    </form>
  );
}

/** Pedido no painel do dono: aprovar (empresa existente ou nova) ou recusar. */
export function AccessRequestCard({ request, companies }: { request: erp.AccessRequest; companies: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(approveRequest.bind(null, request.id), IDLE as LinkState);
  // Quem informou a própria empresa provavelmente quer uma nova; quem não informou, entra numa existente.
  const [target, setTarget] = useState(request.company || !companies[0] ? "new" : companies[0].id);
  const [rejected, setRejected] = useState<ActionState>(IDLE);
  const [rejecting, startReject] = useTransition();
  const isNew = target === "new";

  return (
    <Card className="flex h-full flex-col gap-3 p-5">
      <div className="flex flex-col gap-0.5">
        <p className="font-semibold">{request.name}</p>
        <p className="font-mono text-caption text-muted-foreground">{request.email}</p>
        {request.company && <p className="text-body-sm">{request.company}</p>}
        <p className="font-mono text-caption text-muted-foreground">pedido em {formatDateTime(request.createdAt)}</p>
      </div>
      {request.message && <blockquote className="border-l-2 border-primary/50 pl-3 text-body-sm text-muted-foreground">{request.message}</blockquote>}

      {state.status === "success" ? (
        <LinkBox state={state} />
      ) : rejected.status === "success" ? (
        <FormMessage state={rejected} />
      ) : (
        <form action={action} className="flex flex-col gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Empresa">
              <select name="target" value={target} onChange={(event) => setTarget(event.target.value)} className={selectClassName}>
                <option value="new">Nova empresa para a pessoa</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </FormField>
            {isNew ? (
              <FormField label="Nome da nova empresa">
                <Input name="companyName" defaultValue={request.company ?? `Mercado de ${request.name.split(" ")[0]}`} maxLength={60} />
              </FormField>
            ) : (
              <FormField label="Papel">
                <select name="role" defaultValue="seller" className={selectClassName}>
                  {erp.ROLES.map((role) => (
                    <option key={role} value={role}>
                      {erp.ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </FormField>
            )}
          </div>
          {isNew && <p className="text-caption text-muted-foreground">Na empresa nova, a pessoa entra como Administrador.</p>}
          <FormMessage state={state} />
          <FormMessage state={rejected} />
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending || rejecting}>
              {pending ? "Aprovando…" : "Aprovar e gerar convite"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={pending || rejecting}
              onClick={() => startReject(async () => setRejected(await rejectRequest(request.id)))}
              className="text-muted-foreground hover:text-destructive"
            >
              Recusar
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
