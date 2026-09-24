import type { SystemItem } from "@/content/types";
import { Section, type SectionProps } from "@/components/layout/section";
import { Reveal } from "@/components/motion/motion";
import { SystemsCarousel } from "./systems-carousel";

export interface SystemsSectionProps extends Omit<SectionProps, "children"> {
  items: SystemItem[];
  openLabel: string;
}

export function SystemsSection({ items, openLabel, ...section }: SystemsSectionProps) {
  return (
    <Section {...section} tone="muted">
      <Reveal>
        <SystemsCarousel items={items} openLabel={openLabel} />
      </Reveal>
    </Section>
  );
}
