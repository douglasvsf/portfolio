"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@godzilla/ui";
import type { DecadeSlice } from "@/lib/spotify/transform";

const config = { tracks: { label: "Tracks", color: "hsl(var(--chart-1))" } } satisfies ChartConfig;

/** Colunas por década de lançamento, em ordem cronológica. */
export function DecadeChart({ data }: { data: DecadeSlice[] }) {
  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <BarChart data={data} margin={{ top: 24, left: 0, right: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="decade" tickLine={false} axisLine={false} className="font-mono" />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideIndicator valueFormatter={(value) => `${value} track${Number(value) === 1 ? "" : "s"}`} />}
        />
        <Bar dataKey="tracks" fill="var(--color-tracks)" radius={[4, 4, 0, 0]}>
          <LabelList dataKey="tracks" position="top" className="fill-muted-foreground font-mono" fontSize={12} />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
