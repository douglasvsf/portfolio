import { SectionHeading } from "@/components/ui/section-heading";
import { getExperience } from "@/lib/api";

export async function ExperienceSection() {
  const experience = await getExperience();

  return (
    <section id="experiencia" className="border-t border-border bg-bg-elevated/40">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeading index="04" title="Experiência" />

        <ol className="flex flex-col gap-10 border-l border-border-strong pl-8">
          {experience.map((item) => (
            <li key={`${item.company}-${item.period}`} className="relative">
              <span className="absolute -left-[41px] top-1.5 h-3 w-3 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)]" />
              <p className="font-mono text-xs uppercase tracking-wider text-muted-2">
                {item.period}
              </p>
              <h3 className="mt-1 text-lg font-semibold">{item.role}</h3>
              <p className="font-mono text-sm text-accent">{item.company}</p>
              <p className="mt-2 max-w-2xl text-sm text-muted">{item.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
