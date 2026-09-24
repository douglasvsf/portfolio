import type { Meta, StoryObj } from "@storybook/react";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "./table";
import { Badge } from "../../atoms/badge/badge";

const meta: Meta<typeof Table> = {
  title: "Organisms/Table",
  component: Table,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof Table>;

const rows = [
  { ticker: "PETR4", name: "Petrobras", price: 49.6, change: 2.59 },
  { ticker: "VALE3", name: "Vale", price: 71.48, change: -0.42 },
  { ticker: "ITUB4", name: "Itaú Unibanco", price: 42.37, change: -1.88 },
];

export const Default: Story = {
  render: () => (
    <Table>
      <TableCaption>Cotações de fechamento.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Ativo</TableHead>
          <TableHead>Empresa</TableHead>
          <TableHead className="text-right">Preço</TableHead>
          <TableHead className="text-right">Variação</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.ticker}>
            <TableCell className="font-mono font-medium">{row.ticker}</TableCell>
            <TableCell>{row.name}</TableCell>
            <TableCell className="text-right font-mono tabular-nums">R$ {row.price.toFixed(2)}</TableCell>
            <TableCell className="text-right">
              <Badge variant={row.change >= 0 ? "success" : "destructive"}>
                {row.change > 0 ? "+" : ""}
                {row.change.toFixed(2)}%
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  ),
};
