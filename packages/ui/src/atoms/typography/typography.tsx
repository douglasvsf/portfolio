import { createElement, forwardRef, type ElementType, type HTMLAttributes } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

/** Elemento HTML semântico padrão para cada variante — sobrescrevível via `as`. */
const defaultElement: Record<string, ElementType> = {
  display: "h1",
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  "body-lg": "p",
  body: "p",
  "body-sm": "p",
  caption: "span",
  label: "span",
  overline: "span",
};

export const typographyVariants = cva("text-foreground", {
  variants: {
    variant: {
      display: "text-display font-extrabold tracking-tight",
      h1: "text-h1 font-bold tracking-tight",
      h2: "text-h2 font-bold tracking-tight",
      h3: "text-h3 font-semibold",
      h4: "text-h4 font-semibold",
      "body-lg": "text-body-lg font-normal",
      body: "text-body font-normal",
      "body-sm": "text-body-sm font-normal",
      caption: "text-caption font-normal text-muted-foreground",
      label: "text-label font-medium",
      overline: "text-overline font-semibold uppercase tracking-widest text-muted-foreground",
    },
  },
  defaultVariants: { variant: "body" },
});

export interface TypographyProps
  extends HTMLAttributes<HTMLElement>,
    VariantProps<typeof typographyVariants> {
  /** Sobrescreve o elemento HTML renderizado (mantém o estilo da variante). */
  as?: ElementType;
  /** Renderiza o filho como raiz (Radix Slot) em vez de criar um novo elemento. */
  asChild?: boolean;
}

/**
 * Componente de tipografia único que concentra toda a escala do Design
 * System — evita `<h1 className="text-3xl font-bold ...">` espalhado e
 * divergente pelas aplicações.
 */
export const Typography = forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant = "body", as, asChild = false, ...props }, ref) => {
    const className_ = cn(typographyVariants({ variant }), className);

    if (asChild) {
      return <Slot ref={ref} className={className_} {...props} />;
    }

    const Component = as ?? defaultElement[variant ?? "body"] ?? "p";
    return createElement(Component, { ref, className: className_, ...props });
  },
);

Typography.displayName = "Typography";
