"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "@godzilla/icons";
import { useTranslation } from "@godzilla/i18n";
import { cn } from "../../lib/utils";

export const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-body-sm font-medium",
    "transition-colors duration-(--duration-fast) ease-(--ease-standard)",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/80",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:bg-secondary/70",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-(--size-control-sm) px-3 [&_svg]:size-(--size-icon-sm)",
        md: "h-(--size-control-md) px-4 [&_svg]:size-(--size-icon-md)",
        lg: "h-(--size-control-lg) px-6 text-body [&_svg]:size-(--size-icon-md)",
        icon: "size-(--size-control-md) p-0 [&_svg]:size-(--size-icon-md)",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Renderiza o filho como raiz (Radix Slot) em vez de um <button> — útil para `<Button asChild><Link ...` */
  asChild?: boolean;
  /** Estado de carregamento: desabilita o botão e troca o conteúdo por um spinner. */
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      children,
      "aria-label": ariaLabel,
      ...props
    },
    ref,
  ) => {
    const t = useTranslation();
    const Comp = asChild ? Slot : "button";
    const isIconOnly = size === "icon";

    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        aria-label={isIconOnly && loading ? t.loading : ariaLabel}
        {...props}
      >
        {/* Com asChild o Slot exige exatamente um filho — o spinner não é injetado. */}
        {asChild ? (
          children
        ) : (
          <>
            {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
            {loading && isIconOnly ? null : children}
          </>
        )}
      </Comp>
    );
  },
);

Button.displayName = "Button";
