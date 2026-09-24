"use client";

import {
  createContext,
  forwardRef,
  useContext,
  useId,
  type ComponentProps,
  type ComponentType,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import * as RechartsPrimitive from "recharts";
import type { LegendPayload, TooltipContentProps } from "recharts";
import { cn } from "../../lib/utils";

/**
 * Wrapper do Recharts no padrão shadcn/ui: cada série é descrita num
 * `ChartConfig` (rótulo + cor) e vira uma CSS var `--color-<chave>` dentro do
 * container. Assim os gráficos usam `var(--color-preco)` e herdam o tema
 * (light/dark) automaticamente pelos tokens `--chart-1..5`.
 */
export type ChartConfig = Record<
  string,
  {
    label?: ReactNode;
    icon?: ComponentType;
    /** Qualquer cor CSS — de preferência um token: `hsl(var(--chart-1))`. */
    color?: string;
  }
>;

const ChartContext = createContext<{ config: ChartConfig } | null>(null);

export function useChart() {
  const context = useContext(ChartContext);
  if (!context) throw new Error("useChart precisa estar dentro de <ChartContainer />");
  return context;
}

export interface ChartContainerProps extends HTMLAttributes<HTMLDivElement> {
  config: ChartConfig;
  children: ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>["children"];
}

export const ChartContainer = forwardRef<HTMLDivElement, ChartContainerProps>(
  ({ id, className, children, config, style, ...props }, ref) => {
    const uniqueId = useId();
    const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;

    const colorVars = Object.fromEntries(
      Object.entries(config)
        .filter(([, item]) => item.color)
        .map(([key, item]) => [`--color-${key}`, item.color]),
    ) as CSSProperties;

    return (
      <ChartContext.Provider value={{ config }}>
        <div
          ref={ref}
          data-chart={chartId}
          style={{ ...colorVars, ...style }}
          className={cn(
            "flex aspect-video justify-center text-caption",
            // Recharts desenha com atributos SVG fixos — reaponta para os tokens.
            "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground",
            "[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/60",
            "[&_.recharts-curve.recharts-tooltip-cursor]:stroke-border",
            "[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted/60",
            "[&_.recharts-reference-line_[stroke='#ccc']]:stroke-border",
            "[&_.recharts-dot[stroke='#fff']]:stroke-transparent",
            "[&_.recharts-sector[stroke='#fff']]:stroke-transparent",
            "[&_.recharts-layer]:outline-none [&_.recharts-surface]:outline-none",
            className,
          )}
          {...props}
        >
          <RechartsPrimitive.ResponsiveContainer>{children}</RechartsPrimitive.ResponsiveContainer>
        </div>
      </ChartContext.Provider>
    );
  },
);
ChartContainer.displayName = "ChartContainer";

export const ChartTooltip = RechartsPrimitive.Tooltip;

type TooltipItem = TooltipContentProps<number | string, string>["payload"][number];

export interface ChartTooltipContentProps
  extends Partial<Pick<TooltipContentProps<number | string, string>, "active" | "payload" | "label">> {
  className?: string;
  indicator?: "dot" | "line";
  hideLabel?: boolean;
  hideIndicator?: boolean;
  /** Campo do item de dados usado como nome da série (padrão: dataKey). */
  nameKey?: string;
  labelFormatter?: (label: ReactNode, payload: readonly TooltipItem[]) => ReactNode;
  valueFormatter?: (value: number | string, name: string, item: TooltipItem) => ReactNode;
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  className,
  indicator = "dot",
  hideLabel = false,
  hideIndicator = false,
  nameKey,
  labelFormatter,
  valueFormatter,
}: ChartTooltipContentProps) {
  const { config } = useChart();

  if (!active || !payload?.length) return null;

  return (
    <div
      className={cn(
        "grid min-w-32 gap-1.5 rounded-md border border-border bg-popover px-2.5 py-1.5 text-caption text-popover-foreground shadow-md",
        className,
      )}
    >
      {!hideLabel && label !== undefined && (
        <div className="font-medium">{labelFormatter ? labelFormatter(label, payload) : label}</div>
      )}
      <div className="grid gap-1">
        {payload.map((item, index) => {
          const key = String(nameKey ? item.payload?.[nameKey] : (item.dataKey ?? item.name ?? "value"));
          const itemConfig = config[key];
          const color = item.payload?.fill ?? item.color ?? `var(--color-${key})`;

          return (
            <div key={`${key}-${index}`} className="flex items-center gap-2">
              {!hideIndicator && (
                <span
                  aria-hidden="true"
                  className={cn("shrink-0 rounded-[2px]", indicator === "dot" ? "size-2.5" : "h-2.5 w-1")}
                  style={{ backgroundColor: color }}
                />
              )}
              <span className="text-muted-foreground">{itemConfig?.label ?? item.name ?? key}</span>
              {item.value !== undefined && (
                <span className="ml-auto pl-3 font-mono font-medium tabular-nums text-foreground">
                  {valueFormatter
                    ? valueFormatter(item.value as number | string, String(item.name ?? key), item)
                    : typeof item.value === "number"
                      ? item.value.toLocaleString()
                      : String(item.value)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const ChartLegend = RechartsPrimitive.Legend;

export interface ChartLegendContentProps {
  className?: string;
  payload?: readonly LegendPayload[];
  nameKey?: string;
}

export function ChartLegendContent({ className, payload, nameKey }: ChartLegendContentProps) {
  const { config } = useChart();
  if (!payload?.length) return null;

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-4 pt-3", className)}>
      {payload.map((item) => {
        const itemPayload = item.payload as Record<string, unknown> | undefined;
        const key = String(nameKey ? itemPayload?.[nameKey] : (item.dataKey ?? item.value ?? "value"));
        const itemConfig = config[key];
        return (
          <div key={key} className="flex items-center gap-1.5">
            <span aria-hidden="true" className="size-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: item.color }} />
            <span className="text-muted-foreground">{itemConfig?.label ?? key}</span>
          </div>
        );
      })}
    </div>
  );
}
