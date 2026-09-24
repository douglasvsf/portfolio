"use client";

import { Cell, Pie, PieChart } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@godzilla/ui";
import { formatCompact } from "@/lib/format";

export interface SectorSlice {
  sector: string;
  volume: number;
}

const colors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--muted-foreground))",
];

/**
 * Rosca com a participação de cada setor no volume negociado. Espera no
 * máximo 6 fatias (5 setores + "Outros") — uma cor da paleta para cada.
 */
export function SectorChart({ data }: { data: SectorSlice[] }) {
  const config = Object.fromEntries(data.map((item) => [item.sector, { label: item.sector }])) satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="aspect-auto h-80 w-full">
      <PieChart>
        <ChartTooltip
          content={<ChartTooltipContent nameKey="sector" hideLabel valueFormatter={(v) => formatCompact(Number(v))} />}
        />
        <Pie data={data} dataKey="volume" nameKey="sector" innerRadius="55%" outerRadius="80%" paddingAngle={2} strokeWidth={0}>
          {data.map((item, index) => (
            <Cell key={item.sector} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <ChartLegend content={<ChartLegendContent nameKey="sector" />} />
      </PieChart>
    </ChartContainer>
  );
}
