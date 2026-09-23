import type { SkillGroup } from "@portfolio/shared";
import { Badge } from "@godzilla/ui";
import { Section, type SectionProps } from "@/components/layout/section";

export interface SkillsSectionProps extends Omit<SectionProps, "children"> {
  groups: SkillGroup[];
}

export function SkillsSection({ groups, ...section }: SkillsSectionProps) {
  return (
    <Section tone="muted" {...section}>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {groups.map((group) => (
          <div key={group.category} className="flex flex-col gap-4">
            <h3 className="font-mono text-body-sm font-semibold uppercase tracking-wider text-primary">
              {group.category}
            </h3>
            <ul className="flex flex-wrap gap-2">
              {group.items.map((item) => (
                <li key={item}>
                  <Badge variant="tag">{item}</Badge>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  );
}
