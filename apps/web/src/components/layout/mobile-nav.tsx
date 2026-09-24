"use client";

import { Menu } from "@godzilla/icons";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger, cn, useTranslation } from "@godzilla/ui";
import type { LinkItem } from "@/content/types";

/**
 * Menu hambúrguer do portfólio (abaixo de lg, onde o menu do header some).
 * Painel lateral do DS (Sheet): foco preso, Esc fecha, e cada link fecha o
 * painel antes de rolar até a seção.
 */
export function MobileNav({ brand, links, className }: { brand: string; links: LinkItem[]; className?: string }) {
  const t = useTranslation();

  return (
    <Sheet>
      <SheetTrigger
        aria-label={t.openMenu}
        className={cn(
          "inline-flex size-(--size-control-md) items-center justify-center rounded-md border border-input text-foreground transition-colors",
          "hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          className,
        )}
      >
        <Menu className="size-(--size-icon-md)" aria-hidden="true" />
      </SheetTrigger>
      <SheetContent aria-describedby={undefined} className="gap-8">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-mono text-body-sm font-semibold tracking-widest">
            <span className="size-2 animate-pulse-slow rounded-full bg-primary shadow-glow-sm" aria-hidden="true" />
            {brand}
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 font-mono text-body">
          {links.map((link, index) => (
            <SheetClose key={link.href} asChild>
              <a
                href={link.href}
                className="flex items-baseline gap-3 rounded-md px-3 py-3 text-muted-foreground transition-colors hover:bg-accent hover:text-primary"
              >
                <span className="text-caption text-primary">{String(index + 1).padStart(2, "0")}</span>
                {link.label}
              </a>
            </SheetClose>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
