"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@godzilla/ui";
import { formatPercent } from "@/lib/stocks/format";

const config = { change: { label: "Variação" } } satisfies ChartConfig;

export interface Mover {
  ticker: string;
  change: number;
}

/** Barras horizontais de variação diária — verde para alta, vermelho para queda. */
export function MoversChart({ data }: { data: Mover[] }) {
  return (
    <ChartContainer config={config} className="aspect-auto h-72 w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 4, right: 16 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
        <YAxis type="category" dataKey="ticker" tickLine={false} axisLine={false} width={56} className="font-mono" />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideIndicator valueFormatter={(v) => formatPercent(Number(v))} />}
        />
        <Bar dataKey="change" radius={4}>
          {data.map((item) => (
            <Cell
              key={item.ticker}
              fill={item.change >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
