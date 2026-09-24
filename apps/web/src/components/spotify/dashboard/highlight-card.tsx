import type { ReactNode } from "react";
import { Card } from "@godzilla/ui";

/** Card do topo do Overview: rótulo, arte, destaque e uma linha de apoio. */
export function HighlightCard({
  label,
  art,
  title,
  subtitle,
  testId,
}: {
  label: string;
  art: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  testId?: string;
}) {
  return (
    <Card data-testid={testId} className="group flex flex-col gap-4 p-5 transition-colors hover:border-primary/40">
      <span className="text-overline font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
      <div className="flex min-w-0 items-center gap-3">
        {art}
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-body font-semibold">{title}</span>
          {subtitle && <span className="truncate text-body-sm text-muted-foreground">{subtitle}</span>}
        </div>
      </div>
    </Card>
  );
}
