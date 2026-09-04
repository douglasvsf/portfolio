import { SectionHeading } from "@/components/ui/section-heading";
import { Badge } from "@/components/ui/badge";
import { getSkills } from "@/lib/api";

export async function SkillsSection() {
  const skillGroups = await getSkills();

  return (
    <section id="skills" className="border-t border-border bg-bg-elevated/40">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <SectionHeading
          index="02"
          title="Skills"
          description="Conjunto de tecnologias e práticas utilizadas no dia a dia."
        />

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {skillGroups.map((group) => (
            <div key={group.category} className="flex flex-col gap-4">
              <h3 className="font-mono text-sm font-semibold uppercase tracking-wider text-accent">
                {group.category}
              </h3>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <Badge key={item}>{item}</Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
