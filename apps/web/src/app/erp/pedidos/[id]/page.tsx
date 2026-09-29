import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "@godzilla/icons";
import { Card, CardContent, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@godzilla/ui";
import { erp } from "@portfolio/shared";
import { OrderActions } from "@/components/erp/order-actions";
import { OrderStatusBadge } from "@/components/erp/ui";
import { formatDateTime, money, quantity } from "@/lib/erp/format";
import { getOrder, requireSession } from "@/lib/erp/queries";

export async function generateMetadata({ params }: PageProps<"/erp/pedidos/[id]">): Promise<Metadata> {
  const order = await getOrder((await params).id);
  return { title: order ? `Pedido #${order.number}` : "Pedido" };
}

export default async function OrderPage({ params, searchParams }: PageProps<"/erp/pedidos/[id]">) {
  await requireSession();
  const [{ id }, { criado }] = await Promise.all([params, searchParams]);
  const order = await getOrder(id);
  if (!order) notFound();

  const timeline: { label: string; at: string; by?: string }[] = [
    { label: "Criado", at: order.createdAt, by: erp.ROLE_LABELS[order.createdByRole] },
    ...(order.confirmedAt ? [{ label: "Confirmado — estoque baixado", at: order.confirmedAt }] : []),
    ...(order.cancelledAt ? [{ label: order.confirmedAt ? "Cancelado — estoque devolvido" : "Cancelado", at: order.cancelledAt }] : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <Link href="/erp/pedidos" className="inline-flex w-fit items-center gap-2 font-mono text-body-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="size-(--size-icon-sm)" aria-hidden="true" /> Pedidos
      </Link>

      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="flex items-center gap-3 text-h2 font-bold tracking-tight">
            Pedido <span className="font-mono text-primary">#{order.number}</span>
            <OrderStatusBadge status={order.status} />
          </h1>
          <p className="text-body-sm text-muted-foreground">
            {order.customer.name} · {formatDateTime(order.createdAt)}
          </p>
        </div>
        <OrderActions order={order} />
      </header>

      {criado && order.status === "draft" && (
        <p role="status" className="rounded-md border border-primary/40 bg-primary/5 px-4 py-3 text-body-sm">
          Pedido criado como rascunho. Confirme para baixar o estoque — se faltar algum item, nada é baixado.
        </p>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-2 lg:col-span-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead className="text-right">Quantidade</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {order.items.map((item) => (
                <TableRow key={item.productId}>
                  <TableCell>
                    <span className="flex flex-col">
                      <span>{item.name}</span>
                      <span className="font-mono text-caption text-muted-foreground">{item.sku}</span>
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{quantity(item.quantity, item.unit)}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums text-muted-foreground">{money(item.unitPriceCents)}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{money(item.totalCents)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        <div className="flex flex-col gap-4">
          <Card>
            <CardContent className="pt-6">
              <dl className="flex flex-col gap-2 text-body-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Subtotal</dt>
                  <dd className="font-mono tabular-nums">{money(order.subtotalCents)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Desconto</dt>
                  <dd className="font-mono tabular-nums">− {money(order.discountCents)}</dd>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-h4 font-semibold">
                  <dt>Total</dt>
                  <dd className="font-mono tabular-nums text-primary">{money(order.totalCents)}</dd>
                </div>
              </dl>
              {order.notes && <p className="mt-4 text-caption text-muted-foreground">Obs.: {order.notes}</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle as="h2" className="text-body font-semibold">
                Histórico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="flex flex-col gap-3 border-l border-input pl-4">
                {timeline.map((event) => (
                  <li key={event.label} className="relative text-body-sm">
                    <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-primary" aria-hidden="true" />
                    <span className="block">{event.label}</span>
                    <span className="font-mono text-caption text-muted-foreground">
                      {formatDateTime(event.at)}
                      {event.by ? ` · ${event.by}` : ""}
                    </span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
