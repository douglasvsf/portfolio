import { Stagger, StaggerItem } from "@/components/motion/motion";
import type { SnapshotItem } from "@/content/projects";

/**
 * "Engineering snapshot": os números de destaque dos cases, lidos como um
 * painel de terminal. Entrada em cascata, sem contadores animados.
 */
export function ProjectSnapshot({ label, items }: { label: string; items: SnapshotItem[] }) {
  return (
    <figure className="rounded-lg border border-border bg-card/60 p-6 sm:p-8">
      <figcaption className="flex items-center gap-3 font-mono text-caption uppercase tracking-widest text-muted-foreground">
        <span className="size-1.5 rounded-full bg-primary shadow-glow-sm" aria-hidden="true" />
        {label}
      </figcaption>
      <Stagger as="dl" className="mt-6 grid grid-cols-2 gap-x-6 gap-y-8 lg:grid-cols-4">
        {items.map((item) => (
          <StaggerItem key={item.label} className="flex flex-col-reverse gap-1 border-l border-primary/40 pl-4">
            <dt className="font-mono text-caption uppercase tracking-wider text-muted-foreground">{item.label}</dt>
            <dd className="font-mono text-h2 font-bold leading-none text-primary">{item.value}</dd>
          </StaggerItem>
        ))}
      </Stagger>
    </figure>
  );
}
