"use client";

import { Bar, BarChart, CartesianGrid, LabelList, XAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@godzilla/ui";
import { useSpotifyDictionary } from "@/content/spotify";
import { plural } from "@/i18n/message";
import type { DecadeSlice } from "@/lib/spotify/transform";

/** Colunas por década de lançamento, em ordem cronológica. */
export function DecadeChart({ data }: { data: DecadeSlice[] }) {
  const { dict, locale } = useSpotifyDictionary();
  const config = { tracks: { label: dict.overview.tracksLabel, color: "hsl(var(--chart-1))" } } satisfies ChartConfig;

  return (
    <ChartContainer config={config} className="aspect-auto h-64 w-full">
      <BarChart data={data} margin={{ top: 24, left: 0, right: 0 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="decade" tickLine={false} axisLine={false} className="font-mono" />
        <ChartTooltip
          cursor={false}
          content={<ChartTooltipContent hideIndicator valueFormatter={(value) => plural(dict.charts.tracksCount, Number(value), locale)} />}
        />
        <Bar dataKey="tracks" fill="var(--color-tracks)" radius={[4, 4, 0, 0]}>
          <LabelList dataKey="tracks" position="top" className="fill-muted-foreground font-mono" fontSize={12} />
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
