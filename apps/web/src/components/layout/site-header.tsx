import type { LinkItem, SystemsMenu as SystemsMenuContent } from "@/content/types";
import type { Locale } from "@/i18n/config";
import { LanguageSwitcher } from "./language-switcher";
import { SystemsMenu } from "./systems-menu";

export interface SiteHeaderProps {
  brand: string;
  /** Destino do logo. @default "#hero" */
  brandHref?: string;
  links: LinkItem[];
  /** Dropdown com os sistemas publicados junto com o site (último item do menu). */
  systems: SystemsMenuContent;
  locale: Locale;
  /** Texto do link "pular para o conteúdo" (visível só no foco via teclado). */
  skipToContent: string;
  /** Id do <main> para o link de pular. @default "content" */
  contentId?: string;
}

export function SiteHeader({
  brand,
  brandHref = "#hero",
  links,
  systems,
  locale,
  skipToContent,
  contentId = "content",
}: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-(--z-sticky) border-b border-border bg-background/80 backdrop-blur">
      <a
        href={`#${contentId}`}
        className="sr-only rounded-md bg-primary px-4 py-2 font-mono text-body-sm text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-3"
      >
        {skipToContent}
      </a>

      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-6">
        <a href={brandHref} className="flex items-center gap-2 font-mono text-body-sm font-semibold tracking-widest">
          <span className="size-2 animate-pulse-slow rounded-full bg-primary shadow-glow-sm" aria-hidden="true" />
          {brand}
        </a>

        <div className="flex items-center gap-6">
          <nav className="hidden gap-6 whitespace-nowrap font-mono text-body-sm text-muted-foreground lg:flex xl:gap-8">
            {links.map((link) => (
              <a key={link.href} href={link.href} className="transition-colors hover:text-primary">
                {link.label}
              </a>
            ))}
            <SystemsMenu {...systems} />
          </nav>

          <LanguageSwitcher locale={locale} />
        </div>
      </div>
    </header>
  );
}
