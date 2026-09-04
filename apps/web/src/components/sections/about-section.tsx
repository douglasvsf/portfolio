import { SectionHeading } from "@/components/ui/section-heading";

const FACTS = [
  { label: "Experiência", value: "6+ anos" },
  { label: "Foco", value: "Full Stack" },
  { label: "Stack principal", value: "React & Node.js" },
  { label: "Formação", value: "ADS — Cesumar" },
];

export function AboutSection() {
  return (
    <section id="sobre" className="mx-auto max-w-6xl px-6 py-24">
      <SectionHeading index="01" title="Sobre mim" />

      <div className="grid gap-12 md:grid-cols-2">
        <p className="text-lg leading-relaxed text-muted">
          Meu nome é Douglas Vinicius Szapak Ferreira — no mercado, também conhecido
          como Godzilla. Engenheiro de software com mais de 6 anos de experiência
          entre frontend e backend, passando por migração de sistemas legados,
          construção de APIs e squads multidisciplinares. Uso ferramentas de IA
          (Code Assist e agentes inteligentes) no dia a dia para aumentar
          produtividade e acelerar o desenvolvimento de soluções.
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
