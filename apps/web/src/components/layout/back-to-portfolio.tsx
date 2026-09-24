import Link from "next/link";
import { ArrowLeft } from "@godzilla/icons";
import { appNavLinkClassName, cn } from "@godzilla/ui";

/**
 * Link de volta ao portfólio no header dos sistemas embutidos. No mobile vira
 * só a seta (o texto continua para leitores de tela) — divide espaço com as bandeiras.
 */
export function BackToPortfolio({ label }: { label: string }) {
  return (
    <Link
      href="/"
      title={label}
      className={cn("inline-flex items-center gap-1.5 font-mono text-body-sm text-muted-foreground", appNavLinkClassName)}
    >
      <ArrowLeft className="size-(--size-icon-sm)" aria-hidden="true" />
      <span className="sr-only sm:not-sr-only">{label}</span>
    </Link>
  );
}
