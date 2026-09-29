import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "@godzilla/icons";
import { Badge, Button, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@godzilla/ui";
import { erp } from "@portfolio/shared";
import { EmptyState, FilterLink, OrderStatusBadge, PageHeader, Pagination, withQuery } from "@/components/erp/ui";
import { customerLabel, formatDate, money } from "@/lib/erp/format";
import { listOrders, requireSession } from "@/lib/erp/queries";

export const metadata: Metadata = { title: "Pedidos" };

const pick = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function OrdersPage({ searchParams }: PageProps<"/erp/pedidos">) {
  await requireSession();
  const params = await searchParams;
  const customerId = pick(params.customerId);
  const query = {
    status: erp.ORDER_STATUSES.find((status) => status === pick(params.status)),
    customerId: customerId && erp.objectIdSchema.safeParse(customerId).success ? customerId : undefined,
    page: Math.max(1, Number(pick(params.page)) || 1),
  };
  const result = await listOrders(query);
  const current = { status: query.status, customerId: query.customerId };
  const customerName = query.customerId ? result.items[0]?.customer?.name : undefined;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pedidos"
        description="Rascunho → confirmado (baixa o estoque) → cancelado (devolve o estoque). Vendas do caixa aparecem com a marca PDV."
        actions={
          <Button asChild>
            <Link href="/erp/pedidos/novo">
              <Plus aria-hidden="true" /> Novo pedido
            </Link>
          </Button>
        }
      />

      <nav aria-label="Filtrar pedidos por status" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        <FilterLink href={withQuery("/erp/pedidos", current, { status: undefined, page: undefined })} active={!query.status}>
          Todos
        </FilterLink>
        {erp.ORDER_STATUSES.map((status) => (
          <FilterLink key={status} href={withQuery("/erp/pedidos", current, { status, page: undefined })} active={query.status === status}>
            {erp.ORDER_STATUS_LABELS[status]}
          </FilterLink>
        ))}
      </nav>
      {query.customerId && (
        <p className="text-body-sm text-muted-foreground">
          Pedidos de <strong className="text-foreground">{customerName ?? "cliente selecionado"}</strong> ·{" "}
          <Link href={withQuery("/erp/pedidos", current, { customerId: undefined, page: undefined })} className="text-primary underline-offset-4 hover:underline">
            ver todos
          </Link>
        </p>
      )}

      {result.items.length === 0 ? (
        <EmptyState>Nenhum pedido com esse filtro.</EmptyState>
      ) : (
        <Card className="p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Itens</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link href={`/erp/pedidos/${order.id}`} className="font-mono font-semibold underline-offset-4 hover:text-primary hover:underline">
                      #{order.number}
                    </Link>
                    {order.channel === "pos" && (
                      <Badge variant="outline" className="ml-2 font-mono text-caption">
                        PDV
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className={order.customer ? undefined : "text-muted-foreground"}>{customerLabel(order)}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{order.items.length}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{money(order.totalCents)}</TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className="font-mono text-caption tabular-nums text-muted-foreground">{formatDate(order.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Pagination page={result.page} pageSize={result.pageSize} total={result.total} href={(page) => withQuery("/erp/pedidos", current, { page })} />
    </div>
  );
}
