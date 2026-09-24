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
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 font-mono text-caption text-muted-foreground sm:flex-row">
        <p>
          © {year} {owner}. {rightsReserved}
        </p>
        {links.length ? (
          <nav className="flex gap-6">
            {links.map((link) => (
              <a key={link.href} href={link.href} className="transition-colors hover:text-primary">
                {link.label}
              </a>
            ))}
          </nav>
        ) : null}
      </div>
    </footer>
  );
}
