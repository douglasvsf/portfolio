"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@godzilla/ui";
import { formatMonth, money, moneyCompact } from "@/lib/erp/format";

const config = { total: { label: "Faturamento", color: "hsl(var(--chart-1))" } } satisfies ChartConfig;

/** Faturamento dos pedidos confirmados por mês (valores em centavos). */
export function RevenueChart({ data }: { data: { month: string; totalCents: number; orders: number }[] }) {
  const rows = data.map((row) => ({ month: formatMonth(row.month), total: row.totalCents, orders: row.orders }));
  return (
    <ChartContainer config={config} className="aspect-auto h-72 w-full">
      <BarChart data={rows} margin={{ left: 8, right: 8 }}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <YAxis tickLine={false} axisLine={false} width={72} tickFormatter={(value: number) => moneyCompact(value)} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent valueFormatter={(value) => money(Number(value))} />} />
        <Bar dataKey="total" fill="var(--color-total)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
