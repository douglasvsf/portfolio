const NAV_LINKS = [
  { href: "#sobre", label: "Sobre" },
  { href: "#skills", label: "Skills" },
  { href: "#projetos", label: "Projetos" },
  { href: "#experiencia", label: "Experiência" },
  { href: "#contato", label: "Contato" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <a href="#hero" className="flex items-center gap-2 font-mono text-sm font-semibold tracking-widest text-foreground">
          <span className="h-2 w-2 animate-pulse-slow rounded-full bg-accent shadow-[0_0_10px_var(--color-accent)]" />
          GODZILLA.DEV
        </a>

        <nav className="hidden gap-8 font-mono text-sm text-muted md:flex">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="transition-colors hover:text-accent">
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
