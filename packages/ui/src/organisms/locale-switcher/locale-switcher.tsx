"use client";

import type { ReactNode } from "react";
import { ChevronDown, FlagBR, FlagES, FlagUS } from "@godzilla/icons";
import { localeMeta, locales, useTranslation, type Locale } from "@godzilla/i18n";
import { cn } from "../../lib/utils";
import { Button } from "../../atoms/button/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "../dropdown-menu/dropdown-menu";

export interface LocaleOption {
  value: Locale;
  /** Nome do idioma na própria língua (ex.: "Español"). */
  label: string;
  /** Sigla exibida ao lado da bandeira quando `showLabel` está ativo. */
  shortLabel: string;
  flag: ReactNode;
}

const flags: Record<Locale, ReactNode> = {
  "pt-BR": <FlagBR />,
  "en-US": <FlagUS />,
  "es-ES": <FlagES />,
};

/** Opções padrão: todos os locales suportados por `@godzilla/i18n`, com bandeira. */
export const defaultLocaleOptions: LocaleOption[] = locales.map((value) => ({
  value,
  ...localeMeta[value],
  flag: flags[value],
}));

export interface LocaleSwitcherProps {
  /** Locale ativo. */
  value: Locale;
  /** Chamado com o locale escolhido (não é chamado ao clicar no já ativo). */
  onValueChange: (locale: Locale) => void;
  /** Idiomas oferecidos. @default defaultLocaleOptions */
  options?: LocaleOption[];
  /**
   * `flags`: uma bandeira clicável por idioma, lado a lado.
   * `menu`: botão compacto que abre um dropdown com os idiomas.
   * @default "flags"
   */
  variant?: "flags" | "menu";
  /** Mostra a sigla ("PT", "EN"...) junto da bandeira. @default false */
  showLabel?: boolean;
  /** Rótulo acessível do grupo. @default dicionário `language` do locale ativo */
  "aria-label"?: string;
  className?: string;
}

/**
 * Seletor de idioma com bandeiras. Controlado: não navega nem persiste nada
 * sozinho — quem consome decide o que trocar de idioma significa (rota,
 * cookie, estado local).
 */
export function LocaleSwitcher({
  value,
  onValueChange,
  options = defaultLocaleOptions,
  variant = "flags",
  showLabel = false,
  "aria-label": ariaLabel,
  className,
}: LocaleSwitcherProps) {
  const t = useTranslation();
  const label = ariaLabel ?? t.language;
  const current = options.find((option) => option.value === value) ?? options[0];

  const select = (next: string) => {
    if (next !== value) onValueChange(next as Locale);
  };

  if (variant === "menu") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={cn("gap-2 font-mono", className)} aria-label={`${label}: ${current?.label}`}>
            <span className="flex overflow-hidden rounded-[2px]">{current?.flag}</span>
            {current?.shortLabel}
            <ChevronDown className="opacity-60" aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuRadioGroup value={value} onValueChange={select}>
            {options.map((option) => (
              <DropdownMenuRadioItem key={option.value} value={option.value} lang={option.value}>
                <span className="flex overflow-hidden rounded-[2px]">{option.flag}</span>
                {option.label}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div role="group" aria-label={label} className={cn("inline-flex items-center gap-1", className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            lang={option.value}
            aria-pressed={active}
            aria-label={option.label}
            title={option.label}
            onClick={() => select(option.value)}
            className={cn(
              "inline-flex h-(--size-control-sm) items-center gap-1.5 rounded-md border px-1.5 font-mono text-caption",
              "transition-[opacity,border-color,box-shadow] duration-(--duration-base) ease-(--ease-standard)",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              active
                ? "border-primary text-primary shadow-glow-sm"
                : "border-transparent text-muted-foreground opacity-60 hover:opacity-100 hover:border-border",
            )}
          >
            <span className="flex overflow-hidden rounded-[2px]">{option.flag}</span>
            {showLabel ? <span aria-hidden="true">{option.shortLabel}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
