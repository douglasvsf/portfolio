import { Badge, cn } from "@godzilla/ui";
import { TrendingDown, TrendingUp } from "@godzilla/icons";
import { formatPercent } from "@/lib/format";

export function ChangeBadge({ value, className }: { value: number | null | undefined; className?: string }) {
  if (value == null) return <Badge variant="outline">—</Badge>;

  const Icon = value >= 0 ? TrendingUp : TrendingDown;
  return (
    <Badge
      variant={value > 0 ? "success" : value < 0 ? "destructive" : "secondary"}
      className={cn("gap-1 font-mono tabular-nums", className)}
    >
      <Icon className="size-3" aria-hidden="true" />
      {formatPercent(value)}
    </Badge>
  );
}
