import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle } from "@godzilla/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@godzilla/ui";
import { erp } from "@portfolio/shared";
import { RevenueChart } from "@/components/erp/revenue-chart";
import { EmptyState, PageHeader, StatCard } from "@/components/erp/ui";
import { AllocationChart } from "@/components/stocks/portfolio/allocation-chart";
import { money, quantity } from "@/lib/erp/format";
import { getDashboard, requireSession } from "@/lib/erp/queries";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  await requireSession();
  const dashboard = await getDashboard();
  const { ordersByStatus } = dashboard;
  const categories = dashboard.revenueByCategory.slice(0, 6).map((row) => ({ key: row.category, value: row.totalCents / 100 }));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Dashboard" description="Pedidos confirmados nos últimos 6 meses, calculados direto no banco (aggregation pipeline)." />

      <section aria-label="Indicadores" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Faturamento do mês" value={money(dashboard.currentMonthCents)} hint="pedidos confirmados" />
        <StatCard label="Ticket médio" value={money(dashboard.averageTicketCents)} hint="últimos 6 meses" />
        <StatCard label="Pedidos" value={ordersByStatus.confirmed} hint={`${ordersByStatus.draft} rascunho(s) · ${ordersByStatus.cancelled} cancelado(s)`} />
        <StatCard
          label="Estoque baixo"
          value={dashboard.lowStock.length}
          hint={`de ${dashboard.totals.products} produtos ativos`}
          tone={dashboard.lowStock.length ? "warning" : undefined}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle as="h2">Faturamento por mês</CardTitle>
            <CardDescription>Soma dos pedidos confirmados, com desconto</CardDescription>
          </CardHeader>
          <CardContent>
            <RevenueChart data={dashboard.revenueByMonth} />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle as="h2">Vendas por categoria</CardTitle>
            <CardDescription>Participação no faturamento</CardDescription>
          </CardHeader>
          <CardContent>
            {categories.length ? <AllocationChart data={categories} labels={erp.CATEGORY_LABELS} /> : <EmptyState>Sem vendas no período.</EmptyState>}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle as="h2">Mais vendidos</CardTitle>
            <CardDescription>Por faturamento</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Quantidade</TableHead>
                  <TableHead className="text-right">Faturamento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dashboard.topProducts.map((product) => (
                  <TableRow key={product.productId}>
                    <TableCell>{product.name}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{quantity(product.quantity, product.unit)}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{money(product.revenueCents)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle as="h2" className="flex items-center gap-2">
              <AlertTriangle className="size-(--size-icon-sm) text-warning" aria-hidden="true" />
              Estoque abaixo do mínimo
            </CardTitle>
            <CardDescription>
              <Link href="/erp/produtos?lowStock=true" className="underline-offset-4 hover:text-primary hover:underline">
                Ver todos em Produtos
              </Link>
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.lowStock.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="text-right">Mínimo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboard.lowStock.map((product) => (
                    <TableRow key={product.productId}>
                      <TableCell>{product.name}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-warning">{quantity(product.stock, product.unit)}</TableCell>
                      <TableCell className="text-right font-mono tabular-nums text-muted-foreground">{quantity(product.minStock, product.unit)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState>Nenhum produto abaixo do mínimo.</EmptyState>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
