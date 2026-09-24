"use client";

import { Cell, Pie, PieChart } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, useLocale, type ChartConfig } from "@godzilla/ui";
import type { Locale } from "@/i18n/config";
import type { Slice } from "@/lib/portfolio/positions";
import { createFormatters } from "@/lib/stocks/format";

const colors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--muted-foreground))",
];

/** Rosca de alocação (valor de mercado). Espera no máximo 6 fatias — ver `toSlices`. */
export function AllocationChart({ data, labels }: { data: Slice[]; labels: Record<string, string> }) {
  const format = createFormatters(useLocale() as Locale);
  const total = data.reduce((sum, slice) => sum + slice.value, 0);
  const config = Object.fromEntries(data.map((slice) => [slice.key, { label: labels[slice.key] ?? slice.key }])) satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="aspect-auto h-72 w-full">
      <PieChart>
        <ChartTooltip
          content={
            <ChartTooltipContent
              nameKey="key"
              hideLabel
              valueFormatter={(value) => `${format.currency(Number(value))} · ${format.number(total ? (Number(value) / total) * 100 : 0)}%`}
            />
          }
        />
        <Pie data={data} dataKey="value" nameKey="key" innerRadius="55%" outerRadius="80%" paddingAngle={2} strokeWidth={0}>
          {data.map((slice, index) => (
            <Cell key={slice.key} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="key" />} />
      </PieChart>
    </ChartContainer>
  );
}
