import { SectionHeading } from "@/components/ui/section-heading";

const FACTS = [
  { label: "Experiência", value: "5+ anos" },
  { label: "Foco", value: "Full Stack" },
  { label: "Stack principal", value: "TypeScript" },
  { label: "Localização", value: "Brasil" },
];

export function AboutSection() {
  return (
    <section id="sobre" className="mx-auto max-w-6xl px-6 py-24">
      <SectionHeading index="01" title="Sobre mim" />

      <div className="grid gap-12 md:grid-cols-2">
        <p className="text-lg leading-relaxed text-muted">
          Texto fictício de apresentação. Aqui entra uma descrição pessoal sobre
          trajetória, forma de trabalhar e o que motiva o desenvolvimento de
          software. Substitua este parágrafo por uma apresentação real, destacando
          experiências, valores e objetivos profissionais.
        </p>

        <dl className="grid grid-cols-2 gap-6">
          {FACTS.map((fact) => (
            <div
              key={fact.label}
              className="rounded-lg border border-border bg-bg-elevated p-5"
            >
              <dt className="font-mono text-xs uppercase tracking-wider text-muted-2">
                {fact.label}
              </dt>
              <dd className="mt-2 text-xl font-semibold text-accent">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
