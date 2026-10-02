"use client";

import { useState, useTransition } from "react";
import { Mail, Trash2 } from "@godzilla/icons";
import { Badge, Button, Card, cn } from "@godzilla/ui";
import type { contact } from "@portfolio/shared";
import { deleteMessage, setMessageStatus } from "@/lib/erp/account-actions";
import { IDLE, type ActionState } from "@/lib/erp/action-state";
import { formatDateTime } from "@/lib/erp/format";
import { FormMessage } from "./ui";

const KIND_LABELS: Record<contact.ContactKind, string> = { job: "Vaga", freelance: "Freelance", other: "Outro assunto" };

/** Link de resposta: abre o e-mail já com destinatário e assunto. */
function replyHref(message: contact.ContactMessage) {
  const subject = message.locale === "en-US" ? "Re: your message" : message.locale === "es-ES" ? "Re: tu mensaje" : "Re: sua mensagem";
  return `mailto:${message.email}?subject=${encodeURIComponent(subject)}`;
}

/** Mensagem do formulário de contato no painel do dono: responder, marcar como lida e apagar. */
export function ContactMessageCard({ message }: { message: contact.ContactMessage }) {
  const [state, setState] = useState<ActionState>(IDLE);
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();
  const unread = message.status === "new";

  return (
    <Card className={cn("flex h-full flex-col gap-3 p-5", unread && "border-primary/60")}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="font-semibold">{message.name}</p>
          <p className="truncate font-mono text-caption text-muted-foreground">{message.email}</p>
          {message.company && <p className="text-body-sm">{message.company}</p>}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline">{KIND_LABELS[message.kind]}</Badge>
          {unread && <Badge>Nova</Badge>}
        </div>
      </div>
      <blockquote className="whitespace-pre-wrap break-words border-l-2 border-primary/50 pl-3 text-body-sm text-muted-foreground">{message.message}</blockquote>
      <p className="font-mono text-caption text-muted-foreground">
        {formatDateTime(message.createdAt)}
        {message.locale && ` · ${message.locale}`}
      </p>
      {state.status === "error" && <FormMessage state={state} />}
      <div className="mt-auto flex flex-wrap gap-2">
        <Button asChild size="sm">
          <a href={replyHref(message)}>
            <Mail aria-hidden="true" />
            Responder
          </a>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => start(async () => setState(await setMessageStatus(message.id, unread ? "read" : "new")))}
        >
          {unread ? "Marcar como lida" : "Marcar como não lida"}
        </Button>
        {confirming ? (
          <>
            <Button type="button" size="sm" variant="destructive" disabled={pending} onClick={() => start(async () => setState(await deleteMessage(message.id)))}>
              Apagar mesmo
            </Button>
            <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
          </>
        ) : (
          <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => setConfirming(true)} className="text-muted-foreground hover:text-destructive">
            <Trash2 aria-hidden="true" />
            Apagar
          </Button>
        )}
      </div>
    </Card>
  );
}
