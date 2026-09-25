import { cn } from "@godzilla/ui";
import { Stagger, StaggerItem } from "@/components/motion/motion";
import type { ProjectMetric as Metric } from "@/content/projects";

/** Números como "400K+" em destaque; valores em texto ("Next.js + Node.js") menores. */
const isNumeric = (value: string) => /^[\d.,]+[KM]?\+?$/.test(value);

/** Métricas de um projeto: `dl` semântico, valor em destaque e rótulo abaixo. */
export function ProjectMetrics({ metrics, className }: { metrics: Metric[]; className?: string }) {
  if (metrics.length === 0) return null;
  return (
    <Stagger as="dl" stagger={0.06} className={cn("grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]", className)}>
      {metrics.map((metric) => (
        <StaggerItem key={metric.key} className="flex flex-col-reverse gap-1 rounded-md border border-border bg-background/60 px-4 py-3">
          <ProjectMetric {...metric} />
        </StaggerItem>
      ))}
    </Stagger>
  );
}

export function ProjectMetric({ value, label }: Pick<Metric, "value" | "label">) {
  return (
    <>
      <dt className="text-caption text-muted-foreground">{label}</dt>
      <dd className={cn("font-mono font-semibold leading-tight text-primary", isNumeric(value) ? "text-h3" : "text-body")}>{value}</dd>
    </>
  );
}
