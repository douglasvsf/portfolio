import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

/** Placeholder de carregamento — defina o tamanho/forma via className. */
export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-md bg-muted", className)} {...props} />;
}
