"use client";

import { useActionState, useState } from "react";
import { CheckCircle2 } from "@godzilla/icons";
import { Button, Card, FormField, Input, cn } from "@godzilla/ui";
import { contact } from "@portfolio/shared";
import type { ContactFormCopy } from "@/content/types";
import type { Locale } from "@/i18n/config";
import { fmt } from "@/i18n/message";
import { sendContactMessage, type ContactState } from "@/lib/contact/actions";

const IDLE: ContactState = { status: "idle" };

const textareaClassName = cn(
  "w-full rounded-md border border-input bg-background px-3 py-2 text-body-sm text-foreground placeholder:text-muted-foreground",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
);

interface ContactFormProps {
  copy: ContactFormCopy;
  locale: Locale;
  /** E-mail de contato, oferecido como alternativa quando o envio falha. */
  email: string;
}

/**
 * Formulário de contato para vagas e freelances. A mensagem vai para o painel
 * do dono do site. "Enviar outra mensagem" remonta o formulário limpo.
 */
export function ContactForm(props: ContactFormProps) {
  const [round, setRound] = useState(0);
  return <ContactFields key={round} {...props} onAgain={() => setRound((current) => current + 1)} />;
}

function ContactFields({ copy, locale, email, onAgain }: ContactFormProps & { onAgain: () => void }) {
  const [state, action, pending] = useActionState(sendContactMessage, IDLE);
  const [kind, setKind] = useState<contact.ContactKind>("job");

  if (state.status === "success") {
    return (
      <Card className="flex flex-col items-start gap-3 p-6" role="status" data-testid="contact-success">
        <CheckCircle2 className="size-8 text-primary" aria-hidden="true" />
        <h3 className="text-h4 font-semibold">{copy.success.title}</h3>
        <p className="text-body text-muted-foreground">{copy.success.text}</p>
        <Button type="button" variant="outline" onClick={onAgain}>
          {copy.success.again}
        </Button>
      </Card>
    );
  }

  const failed = state.status === "error" ? state : null;
  const invalid = (field: "name" | "email" | "message") => (failed?.fields?.includes(field) ? copy.errors[field] : undefined);

  return (
    <Card className="relative p-6">
      <form action={action} noValidate className="flex flex-col gap-5" data-testid="contact-form">
        <div className="flex flex-col gap-1">
          <h3 className="text-h4 font-semibold">{copy.title}</h3>
          <p className="text-body-sm text-muted-foreground">{copy.description}</p>
        </div>

        <input type="hidden" name="locale" value={locale} />
        <fieldset>
          <legend className="mb-2 text-body-sm font-medium">{copy.kindLabel}</legend>
          <div className="flex flex-wrap gap-2">
            {contact.CONTACT_KINDS.map((option) => (
              <label
                key={option}
                className={cn(
                  "cursor-pointer rounded-full border px-4 py-1.5 font-mono text-body-sm transition-colors",
                  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary",
                  kind === option ? "border-primary bg-primary/10 text-primary" : "border-input text-muted-foreground hover:text-foreground",
                )}
              >
                <input type="radio" name="kind" value={option} checked={kind === option} onChange={() => setKind(option)} className="sr-only" />
                {copy.kinds[option]}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={copy.name} error={invalid("name")} required>
            <Input name="name" defaultValue={failed?.values.name} autoComplete="name" maxLength={contact.CONTACT_LIMITS.name} />
          </FormField>
          <FormField label={copy.email} error={invalid("email")} required>
            <Input name="email" type="email" defaultValue={failed?.values.email} autoComplete="email" maxLength={contact.CONTACT_LIMITS.email} />
          </FormField>
        </div>
        <FormField label={copy.company} optional>
          <Input name="company" defaultValue={failed?.values.company} autoComplete="organization" maxLength={contact.CONTACT_LIMITS.company} />
        </FormField>
        <FormField label={copy.message} error={invalid("message")} required>
          <textarea name="message" rows={5} defaultValue={failed?.values.message} maxLength={contact.CONTACT_LIMITS.message} placeholder={copy.placeholders[kind]} className={textareaClassName} />
        </FormField>

        {/* Armadilha para robôs: fora da tela e da ordem de tabulação; quem preenche é descartado em silêncio. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label>
            Website
            <input name="website" type="text" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        {failed && (
          <p role="alert" className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-body-sm text-destructive">
            {failed.reason === "unavailable" ? fmt(copy.errors.unavailable, { email }) : copy.errors[failed.reason]}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <Button type="submit" size="lg" disabled={pending} className="font-mono font-semibold">
            {pending ? copy.sending : copy.submit}
          </Button>
          <p className="text-caption text-muted-foreground">{copy.privacy}</p>
        </div>
      </form>
    </Card>
  );
}
