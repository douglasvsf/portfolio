import type { ExperienceItem } from "@portfolio/shared";
import { Badge, Typography } from "@godzilla/ui";
import { Section, type SectionProps } from "@/components/layout/section";
import { Stagger, StaggerItem } from "@/components/motion/motion";

export interface ExperienceSectionProps extends Omit<SectionProps, "children"> {
  items: ExperienceItem[];
}

export function ExperienceSection({ items, ...section }: ExperienceSectionProps) {
  return (
    <Section tone="muted" {...section}>
      <Stagger as="ol" stagger={0.12} className="flex flex-col gap-12 border-l border-input pl-8">
        {items.map((item) => (
          <StaggerItem as="li" key={`${item.company}-${item.period}`} className="relative">
            <span
              className="absolute -left-[39px] top-1.5 size-3 rounded-full bg-primary shadow-glow-sm"
              aria-hidden="true"
            />
            <ExperienceEntry item={item} />
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}

export interface ExperienceEntryProps {
  item: ExperienceItem;
}

export function ExperienceEntry({ item }: ExperienceEntryProps) {
  return (
    <article className="flex max-w-3xl flex-col gap-3">
      <header>
        <Typography variant="overline" as="p" className="font-mono">
          {item.period}
          {item.location ? <span className="normal-case tracking-normal"> · {item.location}</span> : null}
        </Typography>
        <Typography variant="h4" as="h3" className="mt-1">
          {item.role}
        </Typography>
        <p className="font-mono text-body-sm text-primary">{item.company}</p>
      </header>

      <Typography variant="body-sm" className="text-muted-foreground">
        {item.description}
      </Typography>

      {item.highlights?.length ? (
        <ul className="flex flex-col gap-1.5 text-body-sm text-muted-foreground">
          {item.highlights.map((highlight) => (
            <li key={highlight} className="flex gap-2">
              <span className="font-mono text-primary" aria-hidden="true">
                ▹
              </span>
              {highlight}
            </li>
          ))}
        </ul>
      ) : null}

      {item.technologies?.length ? (
        <ul className="mt-1 flex flex-wrap gap-2">
          {item.technologies.map((tech) => (
            <li key={tech}>
              <Badge variant="tag">{tech}</Badge>
            </li>
          ))}
        </ul>
      ) : null}
    </article>
  );
}
