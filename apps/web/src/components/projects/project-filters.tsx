"use client";

import { cn } from "@godzilla/ui";

export interface FilterOption<Value extends string> {
  value: Value;
  label: string;
  count: number;
}

/**
 * Filtros como botões reais (aria-pressed), navegáveis por teclado. No mobile
 * a faixa rola na horizontal em vez de quebrar em várias linhas.
 */
export function ProjectFilters<Value extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: FilterOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
}) {
  return (
    <div role="group" aria-label={label} className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(option.value)}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-1.5 font-mono text-body-sm transition-colors duration-(--duration-base)",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              active
                ? "border-primary bg-primary/10 text-primary"
                : "border-input bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground",
            )}
          >
            {option.label}
            <span className={cn("text-caption", active ? "text-primary" : "text-muted-foreground")}>{option.count}</span>
          </button>
        );
      })}
    </div>
  );
}
