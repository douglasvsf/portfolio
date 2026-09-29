import type { Metadata } from "next";
import { Search, Trash2 } from "@godzilla/icons";
import { Badge, Button, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@godzilla/ui";
import { erp } from "@portfolio/shared";
import { ConfirmAction } from "@/components/erp/confirm-action";
import { ProductDialog } from "@/components/erp/product-dialog";
import { EmptyState, FilterLink, PageHeader, Pagination, withQuery } from "@/components/erp/ui";
import { deactivateProduct } from "@/lib/erp/actions";
import { money, quantity } from "@/lib/erp/format";
import { MAX_LENGTH } from "@/lib/erp/masks";
import { listProducts, requireSession } from "@/lib/erp/queries";

export const metadata: Metadata = { title: "Produtos" };

const pick = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function ProductsPage({ searchParams }: PageProps<"/erp/produtos">) {
  const session = await requireSession();
  const params = await searchParams;
  const query = {
    search: pick(params.search)?.trim() || undefined,
    category: erp.PRODUCT_CATEGORIES.find((category) => category === pick(params.category)),
    lowStock: pick(params.lowStock) === "true" ? "true" : undefined,
    page: Math.max(1, Number(pick(params.page)) || 1),
  };
  const result = await listProducts(query);
  const isAdmin = session.role === "admin";
  const current = { search: query.search, category: query.category, lowStock: query.lowStock };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Produtos"
        description={isAdmin ? "Cadastro, preço e estoque mínimo." : "Como vendedor, você consulta o catálogo — preço e cadastro são do administrador."}
        actions={isAdmin ? <ProductDialog /> : undefined}
      />

      <div className="flex flex-col gap-3">
        <form method="get" className="flex max-w-md gap-2" role="search">
          {query.category && <input type="hidden" name="category" value={query.category} />}
          {query.lowStock && <input type="hidden" name="lowStock" value="true" />}
          <Input name="search" defaultValue={query.search} maxLength={MAX_LENGTH.search} placeholder="Buscar por nome ou SKU" aria-label="Buscar produtos" />
          <Button type="submit" variant="outline" size="icon" aria-label="Buscar">
            <Search aria-hidden="true" />
          </Button>
        </form>
        <nav aria-label="Filtrar produtos" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
          <FilterLink href={withQuery("/erp/produtos", current, { category: undefined, page: undefined })} active={!query.category}>
            Todas
          </FilterLink>
          {erp.PRODUCT_CATEGORIES.map((category) => (
            <FilterLink key={category} href={withQuery("/erp/produtos", current, { category, page: undefined })} active={query.category === category}>
              {erp.CATEGORY_LABELS[category]}
            </FilterLink>
          ))}
          <FilterLink href={withQuery("/erp/produtos", current, { lowStock: query.lowStock ? undefined : "true", page: undefined })} active={Boolean(query.lowStock)}>
            Estoque baixo
          </FilterLink>
        </nav>
      </div>

      {result.items.length === 0 ? (
        <EmptyState>Nenhum produto encontrado com esses filtros.</EmptyState>
      ) : (
        <Card className="p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Preço</TableHead>
                {isAdmin && <TableHead className="text-right">Custo</TableHead>}
                <TableHead className="text-right">Estoque</TableHead>
                {isAdmin && (
                  <TableHead>
                    <span className="sr-only">Ações</span>
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((product) => {
                const low = product.stock < product.minStock;
                return (
                  <TableRow key={product.id}>
                    <TableCell>
                      <span className="flex flex-col">
                        <span className="font-medium">{product.name}</span>
                        <span className="font-mono text-caption text-muted-foreground">{product.sku}</span>
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{erp.CATEGORY_LABELS[product.category]}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{money(product.priceCents)}</TableCell>
                    {isAdmin && <TableCell className="text-right font-mono tabular-nums text-muted-foreground">{money(product.costCents)}</TableCell>}
                    <TableCell className="text-right">
                      <span className="inline-flex items-center gap-2 font-mono tabular-nums">
                        {low && <Badge variant="warning">baixo</Badge>}
                        {quantity(product.stock, product.unit)}
                      </span>
                    </TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <span className="inline-flex gap-1">
                          <ProductDialog product={product} />
                          <ConfirmAction
                            trigger={
                              <Button variant="ghost" size="icon" aria-label={`Desativar ${product.name}`} className="text-muted-foreground hover:text-destructive">
                                <Trash2 aria-hidden="true" />
                              </Button>
                            }
                            title={`Desativar ${product.name}?`}
                            description="O produto sai do catálogo e das vendas, mas pedidos antigos e o histórico de estoque continuam apontando para ele."
                            confirmLabel="Desativar"
                            action={deactivateProduct.bind(null, product.id)}
                          />
                        </span>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      <Pagination page={result.page} pageSize={result.pageSize} total={result.total} href={(page) => withQuery("/erp/produtos", current, { page })} />
    </div>
  );
}
