import type { Meta, StoryObj } from "@storybook/react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent, type ChartConfig } from "./chart";

const meta: Meta<typeof ChartContainer> = {
  title: "Organisms/Chart",
  component: ChartContainer,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ChartContainer>;

const prices = [
  { day: "01/09", close: 41.35 },
  { day: "02/09", close: 41.45 },
  { day: "03/09", close: 42.7 },
  { day: "04/09", close: 43.55 },
  { day: "05/09", close: 45.02 },
  { day: "08/09", close: 46.87 },
  { day: "09/09", close: 48.2 },
  { day: "10/09", close: 47.4 },
  { day: "11/09", close: 49.6 },
];

const priceConfig = { close: { label: "Fechamento", color: "hsl(var(--chart-1))" } } satisfies ChartConfig;

export const Area_: Story = {
  name: "Área — cotação",
  render: () => (
    <ChartContainer config={priceConfig} className="h-72 w-full max-w-2xl">
      <AreaChart data={prices} margin={{ left: 0, right: 8 }}>
        <defs>
          <linearGradient id="fill-close" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--color-close)" stopOpacity={0.4} />
            <stop offset="95%" stopColor="var(--color-close)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="day" tickLine={false} axisLine={false} />
        <YAxis domain={["auto", "auto"]} tickLine={false} axisLine={false} width={40} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area dataKey="close" type="monotone" stroke="var(--color-close)" fill="url(#fill-close)" strokeWidth={2} />
      </AreaChart>
    </ChartContainer>
  ),
};

const volumes = [
  { month: "Jan", buy: 186, sell: 80 },
  { month: "Fev", buy: 305, sell: 200 },
  { month: "Mar", buy: 237, sell: 120 },
  { month: "Abr", buy: 173, sell: 190 },
];

const volumeConfig = {
  buy: { label: "Compra", color: "hsl(var(--chart-1))" },
  sell: { label: "Venda", color: "hsl(var(--chart-2))" },
} satisfies ChartConfig;

export const Bars: Story = {
  name: "Barras — múltiplas séries",
  render: () => (
    <ChartContainer config={volumeConfig} className="h-72 w-full max-w-2xl">
      <BarChart data={volumes}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="buy" fill="var(--color-buy)" radius={4} />
        <Bar dataKey="sell" fill="var(--color-sell)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
};
