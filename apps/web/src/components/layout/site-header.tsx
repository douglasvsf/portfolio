import { AppBrand, AppHeader, appNavLinkClassName } from "@godzilla/ui";
import type { LinkItem } from "@/content/types";
import type { Locale } from "@/i18n/config";
import { LanguageSwitcher } from "./language-switcher";

export interface SiteHeaderProps {
  brand: string;
  /** Destino do logo. @default "#hero" */
  brandHref?: string;
  links: LinkItem[];
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
        </nav>
      }
      actions={<LanguageSwitcher locale={locale} />}
    />
  );
}
