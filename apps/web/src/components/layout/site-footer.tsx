export interface SiteFooterProps {
  owner: string;
  rightsReserved: string;
  /** @default ano corrente */
  year?: number;
}

export function SiteFooter({ owner, rightsReserved, year = new Date().getFullYear() }: SiteFooterProps) {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto max-w-6xl px-6 py-8 text-center font-mono text-caption text-muted-foreground sm:text-left">
        <p>
          © {year} {owner}. {rightsReserved}
        </p>
      </div>
    </footer>
  );
}
