"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, useLocale, type ChartConfig } from "@godzilla/ui";
import { useStocksDictionary } from "@/content/stocks";
import type { Locale } from "@/i18n/config";
import { createFormatters } from "@/lib/stocks/format";

export interface PricePoint {
  /** Rótulo curto do eixo X (dd/mm ou mm/aa). */
  label: string;
  /** Data completa usada no tooltip. */
  date: string;
  close: number;
  volume: number;
}


function tooltipDate(_: unknown, payload: readonly { payload?: PricePoint }[]) {
  return payload[0]?.payload?.date;
}

export function PriceChart({ data, positive }: { data: PricePoint[]; positive: boolean }) {
  const dict = useStocksDictionary();
  const format = createFormatters(useLocale() as Locale);
  const priceConfig = { close: { label: dict.charts.close, color: "hsl(var(--chart-1))" } } satisfies ChartConfig;
  // A cor da linha acompanha o resultado do período (alta = marca, queda = destructive).
  const stroke = positive ? "var(--color-close)" : "hsl(var(--destructive))";

  return (
    <ChartContainer config={priceConfig} className="aspect-auto h-80 w-full">
      <AreaChart data={data} margin={{ left: 0, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="price-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={stroke} stopOpacity={0.35} />
            <stop offset="95%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={32} />
        <YAxis
          domain={["auto", "auto"]}
          tickLine={false}
          axisLine={false}
          width={56}
          tickFormatter={(value: number) => value.toFixed(2)}
        />
        <ChartTooltip
          content={
            <ChartTooltipContent labelFormatter={tooltipDate} valueFormatter={(v) => format.currency(Number(v))} />
          }
        />
        <Area dataKey="close" type="monotone" stroke={stroke} strokeWidth={2} fill="url(#price-fill)" />
      </AreaChart>
    </ChartContainer>
  );
}

export function VolumeChart({ data }: { data: PricePoint[] }) {
  const dict = useStocksDictionary();
  const format = createFormatters(useLocale() as Locale);
  const volumeConfig = { volume: { label: dict.charts.volume, color: "hsl(var(--chart-2))" } } satisfies ChartConfig;
  return (
    <ChartContainer config={volumeConfig} className="aspect-auto h-48 w-full">
      <BarChart data={data} margin={{ left: 0, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} minTickGap={32} />
        <YAxis tickLine={false} axisLine={false} width={56} tickFormatter={(value: number) => format.compact(value)} />
        <ChartTooltip
          content={
            <ChartTooltipContent labelFormatter={tooltipDate} valueFormatter={(v) => format.compact(Number(v))} />
          }
        />
        <Bar dataKey="volume" fill="var(--color-volume)" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
