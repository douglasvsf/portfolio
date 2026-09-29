import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, cn } from "@godzilla/ui";
import { erp } from "@portfolio/shared";
import { MovementDialog } from "@/components/erp/movement-dialog";
import { EmptyState, FilterLink, PageHeader, Pagination, withQuery } from "@/components/erp/ui";
import { formatDateTime, quantity } from "@/lib/erp/format";
import { allProducts, listMovements, requireSession } from "@/lib/erp/queries";

export const metadata: Metadata = { title: "Estoque" };

const pick = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);
const TYPE_VARIANT = { in: "success", out: "destructive", adjust: "warning", sale: "secondary", sale_cancel: "outline" } as const;

export default async function StockPage({ searchParams }: PageProps<"/erp/estoque">) {
  const session = await requireSession();
  const params = await searchParams;
  const productId = pick(params.productId);
  const query = {
    type: erp.MOVEMENT_TYPES.find((type) => type === pick(params.type)),
    productId: productId && erp.objectIdSchema.safeParse(productId).success ? productId : undefined,
    page: Math.max(1, Number(pick(params.page)) || 1),
  };
  const [result, products] = await Promise.all([listMovements(query), allProducts()]);
  const units = new Map(products.map((product) => [product.id, product.unit]));
  const filteredProduct = products.find((product) => product.id === query.productId);
  const current = { type: query.type, productId: query.productId };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Estoque"
        description="Livro-razão: cada entrada, saída, venda e ajuste com o saldo resultante. Nada é editado ou apagado."
        actions={session.role === "admin" ? <MovementDialog products={products} /> : undefined}
      />

      <nav aria-label="Filtrar movimentações" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
        <FilterLink href={withQuery("/erp/estoque", current, { type: undefined, page: undefined })} active={!query.type}>
          Todas
        </FilterLink>
        {erp.MOVEMENT_TYPES.map((type) => (
          <FilterLink key={type} href={withQuery("/erp/estoque", current, { type, page: undefined })} active={query.type === type}>
            {erp.MOVEMENT_LABELS[type]}
          </FilterLink>
        ))}
      </nav>
      {filteredProduct && (
        <p className="text-body-sm text-muted-foreground">
          Mostrando só <strong className="text-foreground">{filteredProduct.name}</strong> ·{" "}
          <Link href={withQuery("/erp/estoque", current, { productId: undefined, page: undefined })} className="text-primary underline-offset-4 hover:underline">
            ver todos
          </Link>
        </p>
      )}

      {result.items.length === 0 ? (
        <EmptyState>Nenhuma movimentação com esse filtro.</EmptyState>
      ) : (
        <Card className="p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Produto</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Variação</TableHead>
                <TableHead className="text-right">Saldo</TableHead>
                <TableHead>Motivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((movement) => {
                const unit = units.get(movement.productId);
                return (
                  <TableRow key={movement.id}>
                    <TableCell className="whitespace-nowrap font-mono text-caption tabular-nums">{formatDateTime(movement.createdAt)}</TableCell>
                    <TableCell>
                      <Link
                        href={withQuery("/erp/estoque", {}, { productId: movement.productId })}
                        className="underline-offset-4 hover:text-primary hover:underline"
                      >
                        {movement.productName}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Badge variant={TYPE_VARIANT[movement.type]}>{erp.MOVEMENT_LABELS[movement.type]}</Badge>
                    </TableCell>
                    <TableCell className={cn("text-right font-mono tabular-nums", movement.delta > 0 ? "text-success" : "text-destructive")}>
                      {movement.delta > 0 ? "+" : ""}
                      {quantity(movement.delta, unit)}
                    </TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{quantity(movement.balanceAfter, unit)}</TableCell>
                    <TableCell className="text-body-sm text-muted-foreground">
                      {movement.orderId ? (
                        <Link href={`/erp/pedidos/${movement.orderId}`} className="underline-offset-4 hover:text-primary hover:underline">
                          {movement.reason}
                        </Link>
                      ) : (
                        movement.reason
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <Pagination page={result.page} pageSize={result.pageSize} total={result.total} href={(page) => withQuery("/erp/estoque", current, { page })} />
    </div>
  );
}
