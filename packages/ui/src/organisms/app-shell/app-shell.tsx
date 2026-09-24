import { forwardRef, type AnchorHTMLAttributes, type HTMLAttributes, type ReactNode } from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cn } from "../../lib/utils";

/*
 * Moldura comum de todos os sistemas do site (portfólio, Kaiju Stocks,
 * Spotify Stats): mesma altura, largura máxima, respiro lateral e estilo de
 * header/footer. Cada app só preenche os slots.
 */

/** Container horizontal padrão — use no <main> e nas seções para alinhar com header/footer. */
export const appContainerClassName = "mx-auto w-full max-w-6xl px-6";

export interface AppHeaderProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
  /** Logo/marca (normalmente um <AppBrand />). */
  brand: ReactNode;
  /** Navegação principal — some no mobile se o app decidir (ex.: `hidden lg:flex`). */
  nav?: ReactNode;
  /** Ações à direita: troca de idioma, usuário, logout, voltar… */
  actions?: ReactNode;
  /** Faixa extra abaixo da barra (ex.: navegação rolável no mobile). */
  below?: ReactNode;
  /** Link "pular para o conteúdo", visível só no foco via teclado. */
  skipToContent?: { label: string; href?: string };
}

export const AppHeader = forwardRef<HTMLElement, AppHeaderProps>(
  ({ brand, nav, actions, below, skipToContent, className, ...props }, ref) => (
    <header
      ref={ref}
      className={cn("sticky top-0 z-(--z-sticky) border-b border-border bg-background/80 backdrop-blur", className)}
      {...props}
    >
      {skipToContent && (
        <a
          href={skipToContent.href ?? "#content"}
          className="sr-only rounded-md bg-primary px-4 py-2 font-mono text-body-sm text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-3"
        >
          {skipToContent.label}
        </a>
      )}
      <div className={cn(appContainerClassName, "flex h-16 items-center justify-between gap-4")}>
        {brand}
        <div className="flex items-center gap-6">
          {nav}
          {actions}
        </div>
      </div>
      {below}
    </header>
  ),
);
AppHeader.displayName = "AppHeader";

export interface AppBrandProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /** Renderiza no elemento filho (ex.: `<Link>` do Next) mantendo o ponto pulsante. */
  asChild?: boolean;
}

/** Marca "terminal": ponto pulsante na cor primária + texto monoespaçado. */
export const AppBrand = forwardRef<HTMLAnchorElement, AppBrandProps>(({ asChild, className, children, ...props }, ref) => {
  const Comp = asChild ? Slot : "a";
  return (
    <Comp
      ref={ref}
      className={cn("flex items-center gap-2 whitespace-nowrap font-mono text-body-sm font-semibold tracking-widest", className)}
      {...props}
    >
      <span className="size-2 shrink-0 animate-pulse-slow rounded-full bg-primary shadow-glow-sm" aria-hidden="true" />
      <Slottable>{children}</Slottable>
    </Comp>
  );
});
AppBrand.displayName = "AppBrand";

/** Links de texto do header/footer (mesmo estilo do menu do portfólio). */
export const appNavLinkClassName = "transition-colors hover:text-primary";

export interface AppFooterProps extends HTMLAttributes<HTMLElement> {
  /** Conteúdo à direita (links secundários). */
  aside?: ReactNode;
}

export const AppFooter = forwardRef<HTMLElement, AppFooterProps>(({ aside, className, children, ...props }, ref) => (
  <footer ref={ref} className={cn("border-t border-border", className)} {...props}>
    <div
      className={cn(
        appContainerClassName,
        "flex flex-col items-center justify-between gap-4 py-8 text-center font-mono text-caption text-muted-foreground sm:flex-row sm:text-left",
      )}
    >
      <div>{children}</div>
      {aside}
    </div>
  </footer>
));
AppFooter.displayName = "AppFooter";
