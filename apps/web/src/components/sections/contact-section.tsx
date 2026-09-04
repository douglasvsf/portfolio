import { SectionHeading } from "@/components/ui/section-heading";

const CONTACT_LINKS = [
  {
    label: "GitHub",
    value: "github.com/douglasvsf",
    href: "https://github.com/douglasvsf",
  },
  {
    label: "LinkedIn",
    value: "linkedin.com/in/douglas-vinicius-szapak-ferreira",
    href: "https://www.linkedin.com/in/douglas-vinicius-szapak-ferreira-2ba7a115b/",
  },
];

export function ContactSection() {
  return (
    <section id="contato" className="mx-auto max-w-6xl px-6 py-24">
      <SectionHeading
        index="05"
        title="Contato"
        description="Vamos conversar? Esses são os melhores canais para me encontrar."
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap">
        {CONTACT_LINKS.map((link) => (
          <a
            key={link.label}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
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
