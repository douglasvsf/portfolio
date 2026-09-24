"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@godzilla/ui";

export interface HorizontalBarChartProps {
  data: Record<string, string | number>[];
  labelKey: string;
  valueKey: string;
  valueLabel: string;
  /** Ex.: 100 para popularidade (0–100). Sem valor, o eixo se ajusta aos dados. */
  max?: number;
  /** Texto após o valor (ex.: " tracks"). String simples: a prop vem de Server Components. */
  valueSuffix?: string;
}

/**
 * Barras horizontais com rótulo no fim — usado para "artistas nas top tracks"
 * e popularidade. Altura cresce com a quantidade de itens.
 */
export function HorizontalBarChart({
  data,
  labelKey,
  valueKey,
  valueLabel,
  max,
  valueSuffix = "",
}: HorizontalBarChartProps) {
  const formatValue = (value: number) => `${value}${valueSuffix}`;
  const config = { [valueKey]: { label: valueLabel, color: "hsl(var(--chart-1))" } } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="aspect-auto w-full" style={{ height: Math.max(160, data.length * 38) }}>
      <BarChart data={data} layout="vertical" margin={{ left: 0, right: 36 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" hide domain={[0, max ?? "dataMax"]} />
        <YAxis
          type="category"
          dataKey={labelKey}
          tickLine={false}
          axisLine={false}
          width={128}
          tickFormatter={(value: string) => (value.length > 18 ? `${value.slice(0, 17)}…` : value)}
        />
        <ChartTooltip cursor={false} content={<ChartTooltipContent hideIndicator valueFormatter={(value) => formatValue(Number(value))} />} />
        <Bar dataKey={valueKey} fill={`var(--color-${valueKey})`} radius={4}>
          <LabelList
            dataKey={valueKey}
            position="right"
            className="fill-muted-foreground font-mono"
            fontSize={12}
            formatter={(value) => formatValue(Number(value))}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
