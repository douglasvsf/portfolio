import type { ExperienceItem } from "@portfolio/shared";
import { Typography } from "@godzilla/ui";
import { Section, type SectionProps } from "@/components/layout/section";

export interface ExperienceSectionProps extends Omit<SectionProps, "children"> {
  items: ExperienceItem[];
}

export function ExperienceSection({ items, ...section }: ExperienceSectionProps) {
  return (
    <Section tone="muted" {...section}>
      <ol className="flex flex-col gap-10 border-l border-input pl-8">
        {items.map((item) => (
          <li key={`${item.company}-${item.period}`} className="relative">
            <span
              className="absolute -left-[39px] top-1.5 size-3 rounded-full bg-primary shadow-glow-sm"
              aria-hidden="true"
            />
            <Typography variant="overline" as="p" className="font-mono">
              {item.period}
            </Typography>
            <Typography variant="h4" as="h3" className="mt-1">
              {item.role}
            </Typography>
            <p className="font-mono text-body-sm text-primary">{item.company}</p>
            <Typography variant="body-sm" className="mt-2 max-w-2xl text-muted-foreground">
              {item.description}
            </Typography>
          </li>
        ))}
      </ol>
    </Section>
  );
}
