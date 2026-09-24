import type { ReactNode } from "react";

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-h3 font-bold tracking-tight sm:text-h2">{title}</h1>
        {description && <p className="text-body-sm text-muted-foreground">{description}</p>}
      </div>
      {actions}
    </div>
  );
}
