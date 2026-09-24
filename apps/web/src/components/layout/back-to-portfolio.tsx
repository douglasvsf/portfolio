import Link from "next/link";
import { ArrowLeft } from "@godzilla/icons";
import { appNavLinkClassName, cn } from "@godzilla/ui";

/** Link de volta ao portfólio usado no header dos sistemas embutidos. */
export function BackToPortfolio({ label, shortLabel = label }: { label: string; shortLabel?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-1.5 font-mono text-body-sm text-muted-foreground", appNavLinkClassName)}>
      <ArrowLeft className="size-(--size-icon-sm)" aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
      <span className="sm:hidden">{shortLabel}</span>
    </Link>
  );
}
