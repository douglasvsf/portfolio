import { Card, Typography } from "@godzilla/ui";
import type { Fact } from "@/content/types";
import { Section, type SectionProps } from "@/components/layout/section";

export interface AboutSectionProps extends Omit<SectionProps, "children"> {
  paragraphs: string[];
  facts: Fact[];
}

export function AboutSection({ paragraphs, facts, ...section }: AboutSectionProps) {
  return (
    <Section {...section}>
      <div className="grid gap-12 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          {paragraphs.map((paragraph) => (
            <Typography key={paragraph} variant="body-lg" className="text-muted-foreground">
              {paragraph}
            </Typography>
          ))}
        </div>

        <dl className="grid grid-cols-2 gap-6">
          {facts.map((fact) => (
            <Card key={fact.label} className="p-5">
              <dt className="font-mono text-caption uppercase tracking-wider text-muted-foreground">{fact.label}</dt>
              <dd className="mt-2 text-h4 font-semibold text-primary">{fact.value}</dd>
            </Card>
          ))}
        </dl>
      </div>
    </Section>
  );
}
