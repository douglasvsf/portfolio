"use client";

import { Cell, Pie, PieChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@godzilla/ui";
import type { GenreSlice } from "@/lib/spotify/transform";

const colors = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(141 40% 30%)",
  "hsl(145 50% 75%)",
  "hsl(var(--muted-foreground))",
];

/** Donut + legenda com % dos artistas analisados em cada gênero. */
export function GenreChart({ data }: { data: GenreSlice[] }) {
  const config = Object.fromEntries(data.map((slice) => [slice.genre, { label: slice.genre }])) satisfies ChartConfig;

  return (
    <div className="grid items-center gap-6 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <ChartContainer config={config} className="mx-auto aspect-square w-full max-w-64">
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                nameKey="genre"
                hideLabel
                valueFormatter={(value) => `${value} artist${Number(value) === 1 ? "" : "s"}`}
              />
            }
          />
          <Pie data={data} dataKey="artists" nameKey="genre" innerRadius="58%" outerRadius="92%" paddingAngle={2} strokeWidth={0}>
            {data.map((slice, index) => (
              <Cell key={slice.genre} fill={colors[index % colors.length]} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>

      <ul className="flex flex-col gap-2.5">
        {data.map((slice, index) => (
          <li key={slice.genre} className="flex items-center gap-3 text-body-sm">
            <span className="size-2.5 shrink-0 rounded-[2px]" style={{ backgroundColor: colors[index % colors.length] }} aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate">{slice.genre}</span>
            <span className="font-mono tabular-nums text-muted-foreground">{Math.round(slice.share * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
