import { SectionHeading } from "@/components/ui/section-heading";

const CONTACT_LINKS = [
  { label: "Email", value: "contato@godzilla.dev", href: "mailto:contato@godzilla.dev" },
  { label: "GitHub", value: "github.com/godzilla", href: "#" },
  { label: "LinkedIn", value: "linkedin.com/in/godzilla", href: "#" },
];

export function ContactSection() {
  return (
    <section id="contato" className="mx-auto max-w-6xl px-6 py-24">
      <SectionHeading
        index="05"
        title="Contato"
        description="Dados fictícios de contato — substitua pelos seus canais reais."
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
        {CONTACT_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            className="flex flex-1 min-w-[220px] flex-col gap-1 rounded-lg border border-border bg-bg-elevated p-5 transition-colors hover:border-accent"
          >
            <span className="font-mono text-xs uppercase tracking-wider text-muted-2">
              {link.label}
            </span>
            <span className="font-medium text-foreground">{link.value}</span>
          </a>
        ))}
      </div>
    </section>
  );
}
