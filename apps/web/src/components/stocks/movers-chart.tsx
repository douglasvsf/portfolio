"use client";

import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, useLocale, type ChartConfig } from "@godzilla/ui";
import { useStocksDictionary } from "@/content/stocks";
import type { Locale } from "@/i18n/config";
import { createFormatters } from "@/lib/stocks/format";

export interface Mover {
  ticker: string;
  change: number;
}

/** Barras horizontais de variação diária — verde para alta, vermelho para queda. */
export function MoversChart({ data }: { data: Mover[] }) {
  const dict = useStocksDictionary();
  const format = createFormatters(useLocale() as Locale);
  const config = { change: { label: dict.charts.change } } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="aspect-auto h-72 w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 4, right: 16 }}>
        <CartesianGrid horizontal={false} />
        <XAxis type="number" tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
        <YAxis type="category" dataKey="ticker" tickLine={false} axisLine={false} width={56} className="font-mono" />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideIndicator valueFormatter={(v) => format.percent(Number(v))} />}
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
