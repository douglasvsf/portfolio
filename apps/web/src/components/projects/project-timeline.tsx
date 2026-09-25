import type { ReactNode } from "react";
import { Stagger, StaggerItem } from "@/components/motion/motion";

/**
 * Linha vertical verde ligando os cases — o mesmo trilho com pontos da seção
 * Experiência. Só no desktop (lg), onde os cards ficam em coluna única; no
 * tablet eles viram grade de 2 colunas e no mobile o trilho sairia apertado.
 */
export function ProjectTimeline({ children }: { children: ReactNode }) {
  return (
    <Stagger as="ol" stagger={0.1} className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 lg:gap-8 lg:border-l lg:border-input lg:pl-10">
      {children}
    </Stagger>
  );
}

export function ProjectTimelineItem({ children }: { children: ReactNode }) {
  return (
    <StaggerItem as="li" className="relative">
      <span className="absolute -left-[47px] top-9 hidden size-3 rounded-full bg-primary shadow-glow-sm lg:block" aria-hidden="true" />
      {children}
    </StaggerItem>
  );
}
