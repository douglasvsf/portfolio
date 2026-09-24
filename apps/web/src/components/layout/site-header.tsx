import { AppBrand, AppHeader, appNavLinkClassName } from "@godzilla/ui";
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
    <AppHeader
      skipToContent={{ label: skipToContent, href: `#${contentId}` }}
      brand={<AppBrand href={brandHref}>{brand}</AppBrand>}
      nav={
        <nav className="hidden gap-6 whitespace-nowrap font-mono text-body-sm text-muted-foreground lg:flex xl:gap-8">
          {links.map((link) => (
            <a key={link.href} href={link.href} className={appNavLinkClassName}>
              {link.label}
            </a>
          ))}
          <SystemsMenu {...systems} />
        </nav>
      }
      actions={<LanguageSwitcher locale={locale} />}
    />
  );
}
