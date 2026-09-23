"use client";

import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "@godzilla/icons";
import { useTranslation } from "@godzilla/i18n";
import { cn } from "../../lib/utils";

const spinnerVariants = cva("animate-spin text-muted-foreground", {
  variants: {
    size: {
      sm: "size-(--size-icon-sm)",
      md: "size-(--size-icon-md)",
      lg: "size-(--size-icon-lg)",
    },
  },
  defaultVariants: { size: "md" },
});

export interface SpinnerProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, "children">,
    VariantProps<typeof spinnerVariants> {
  /** Texto acessível anunciado por leitores de tela. @default t.loading */
  label?: string;
}

export function Spinner({ className, size, label, ...props }: SpinnerProps) {
  const t = useTranslation();
  return (
    <span role="status" className={cn("inline-flex", className)} {...props}>
      <Loader2 className={spinnerVariants({ size })} aria-hidden="true" />
      <span className="sr-only">{label ?? t.loading}</span>
    </span>
  );
}
