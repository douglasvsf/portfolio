"use client";

import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from "react";
import { useTranslation } from "@godzilla/i18n";
import { Label } from "../../atoms/label/label";
import { cn } from "../../lib/utils";

type ControlProps = Record<string, unknown> & { id?: string };

export interface FormFieldProps {
  /** Texto do <Label>. */
  label: string;
  /** Um único elemento de controle (Input, Textarea, Select, etc.). */
  children: ReactElement<ControlProps>;
  /** Texto de apoio, exibido quando não há erro. */
  description?: string;
  /** Mensagem de erro — quando presente, substitui a description e marca o campo como inválido. */
  error?: string;
  required?: boolean;
  optional?: boolean;
  className?: string;
}

/**
 * Compõe Label + controle + description/erro com toda a fiação de
 * acessibilidade (htmlFor, aria-describedby, aria-invalid, aria-required)
 * feita automaticamente — o consumidor só passa o controle como children.
 */
export function FormField({
  label,
  children,
  description,
  error,
  required = false,
  optional = false,
  className,
}: FormFieldProps) {
  const t = useTranslation();
  const reactId = useId();
  const controlId = children.props.id ?? `field-${reactId}`;
  // Erro substitui a description no DOM — o describedBy só referencia o nó
  // que está de fato renderizado, nunca um id "solto" sem elemento.
  const descriptionId = !error && description ? `${controlId}-description` : undefined;
  const errorId = error ? `${controlId}-error` : undefined;
  const describedBy = errorId ?? descriptionId;

  const control = isValidElement(children)
    ? cloneElement(children, {
        id: controlId,
        "aria-describedby": describedBy,
        "aria-invalid": Boolean(error) || undefined,
        "aria-required": required || undefined,
      })
    : (children as ReactNode);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={controlId}>
          {label}
          {required && (
            <span className="ml-0.5 text-destructive" aria-hidden="true">
              *
            </span>
          )}
        </Label>
        {required && <span className="text-caption text-muted-foreground">{t.required}</span>}
        {optional && !required && (
          <span className="text-caption text-muted-foreground">{t.optional}</span>
        )}
      </div>

      {control}

      {error ? (
        <p id={errorId} role="alert" className="text-caption font-medium text-destructive">
          {error}
        </p>
      ) : description ? (
        <p id={descriptionId} className="text-caption text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
