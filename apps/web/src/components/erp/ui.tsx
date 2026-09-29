import Link from "next/link";
import type { ReactNode } from "react";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight } from "@godzilla/icons";
import { Badge, Card, cn } from "@godzilla/ui";
import { erp } from "@portfolio/shared";
import type { ActionState } from "@/lib/erp/action-state";
import { quantity } from "@/lib/erp/format";

/** Peças visuais compartilhadas pelas telas do ERP (sobre o Design System). */

export const selectClassName = cn(
  "h-(--size-control-md) w-full rounded-md border border-input bg-background px-3 text-body-sm text-foreground",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
);

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="text-h2 font-bold tracking-tight">{title}</h1>
        {description && <p className="max-w-2xl text-body-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

export function StatCard({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: string; tone?: "warning" }) {
  return (
    <Card className="flex flex-col gap-1 p-4">
      <span className="text-overline uppercase tracking-widest text-muted-foreground">{label}</span>
      <span className={cn("font-mono text-h3 font-semibold tabular-nums", tone === "warning" ? "text-warning" : "text-foreground")}>{value}</span>
      {hint && <span className="text-caption text-muted-foreground">{hint}</span>}
    </Card>
  );
}

const STATUS_VARIANT = { draft: "outline", confirmed: "success", cancelled: "destructive" } as const;

export function OrderStatusBadge({ status }: { status: erp.OrderStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{erp.ORDER_STATUS_LABELS[status]}</Badge>;
}

/** Paginação por links (funciona sem JavaScript e preserva os filtros). */
export function Pagination({ page, pageSize, total, href }: { page: number; pageSize: number; total: number; href: (page: number) => string }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return <p className="text-caption text-muted-foreground">{total} registro(s)</p>;
  const link = "inline-flex items-center gap-1 rounded-md border border-input px-3 py-1.5 font-mono text-caption hover:border-primary hover:text-primary";
  return (
    <nav aria-label="Paginação" className="flex items-center justify-between gap-3">
      <p className="text-caption text-muted-foreground">
        {total} registros · página {page} de {pages}
      </p>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={href(page - 1)} className={link} rel="prev">
            <ChevronLeft className="size-3.5" aria-hidden="true" /> Anterior
          </Link>
        ) : null}
        {page < pages ? (
          <Link href={href(page + 1)} className={link} rel="next">
            Próxima <ChevronRight className="size-3.5" aria-hidden="true" />
          </Link>
        ) : null}
      </div>
    </nav>
  );
}

/** Mensagem de resultado de um formulário; em falta de estoque, lista os itens. */
export function FormMessage({ state }: { state: ActionState }) {
  if (state.status === "idle") return null;
  if (state.status === "success") {
    return (
      <p role="status" className="flex items-center gap-2 text-body-sm text-success">
        <CheckCircle2 className="size-(--size-icon-sm)" aria-hidden="true" /> {state.message}
      </p>
    );
  }
  return (
    <div role="alert" className="flex flex-col gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-body-sm text-destructive">
      <p className="flex items-center gap-2">
        <AlertTriangle className="size-(--size-icon-sm) shrink-0" aria-hidden="true" /> {state.message}
      </p>
      {state.shortages?.length ? (
        <ul className="ml-6 list-disc text-caption">
          {state.shortages.map((line) => (
            <li key={line.productId}>
              {line.name}: pedido {quantity(line.requested)}, disponível {quantity(line.available)}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Link de filtro (abas por status, categoria…) que mantém a semântica de navegação. */
export function FilterLink({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border px-3 py-1 font-mono text-caption transition-colors",
        active ? "border-primary bg-primary/10 text-primary" : "border-input text-muted-foreground hover:border-primary/50 hover:text-foreground",
      )}
    >
      {children}
    </Link>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-body-sm text-muted-foreground">{children}</p>;
}

/** Monta a URL de uma lista mudando só alguns parâmetros de busca. */
export function withQuery(path: string, current: Record<string, string | undefined>, changes: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...current, ...changes })) if (value !== undefined && value !== "") params.set(key, String(value));
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}
