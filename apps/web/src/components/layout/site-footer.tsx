import { AppFooter, appNavLinkClassName } from "@godzilla/ui";
import type { LinkItem } from "@/content/types";

export interface SiteFooterProps {
  owner: string;
  rightsReserved: string;
  /** Links secundários (ex.: Design System). */
  links?: LinkItem[];
  /** @default ano corrente */
  year?: number;
}

export function SiteFooter({ owner, rightsReserved, links = [], year = new Date().getFullYear() }: SiteFooterProps) {
  return (
    <AppFooter
      aside={
        links.length ? (
          <nav className="flex gap-6">
            {links.map((link) => (
              <a key={link.href} href={link.href} className={appNavLinkClassName}>
                {link.label}
              </a>
            ))}
          </nav>
        ) : null
      }
    >
      © {year} {owner}. {rightsReserved}
    </AppFooter>
  );
}
