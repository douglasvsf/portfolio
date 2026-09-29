import type { Metadata } from "next";
import Link from "next/link";
import { Search, Trash2 } from "@godzilla/icons";
import { Button, Card, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@godzilla/ui";
import { erp } from "@portfolio/shared";
import { ConfirmAction } from "@/components/erp/confirm-action";
import { CustomerDialog } from "@/components/erp/customer-dialog";
import { EmptyState, PageHeader, Pagination, withQuery } from "@/components/erp/ui";
import { deleteCustomer } from "@/lib/erp/actions";
import { listCustomers, requireSession } from "@/lib/erp/queries";

export const metadata: Metadata = { title: "Clientes" };

const pick = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function CustomersPage({ searchParams }: PageProps<"/erp/clientes">) {
  const session = await requireSession();
  const params = await searchParams;
  const query = { search: pick(params.search)?.trim() || undefined, page: Math.max(1, Number(pick(params.page)) || 1) };
  const result = await listCustomers(query);
  const isAdmin = session.role === "admin";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Clientes" description="Pessoas e empresas que compram no mercado." actions={<CustomerDialog />} />

      <form method="get" className="flex max-w-md gap-2" role="search">
        <Input name="search" defaultValue={query.search} placeholder="Buscar por nome ou CPF/CNPJ" aria-label="Buscar clientes" />
        <Button type="submit" variant="outline" size="icon" aria-label="Buscar">
          <Search aria-hidden="true" />
        </Button>
      </form>

      {result.items.length === 0 ? (
        <EmptyState>Nenhum cliente encontrado.</EmptyState>
      ) : (
        <Card className="p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>CPF/CNPJ</TableHead>
                <TableHead>Cidade</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>
                  <span className="sr-only">Ações</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.items.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <Link href={`/erp/pedidos?customerId=${customer.id}`} className="font-medium underline-offset-4 hover:text-primary hover:underline">
                      {customer.name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-caption tabular-nums">{erp.formatDocument(customer.document)}</TableCell>
                  <TableCell className="text-muted-foreground">{customer.city ?? "—"}</TableCell>
                  <TableCell className="text-caption text-muted-foreground">{customer.email ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <span className="inline-flex gap-1">
                      <CustomerDialog customer={customer} />
                      {isAdmin && (
                        <ConfirmAction
                          trigger={
                            <Button variant="ghost" size="icon" aria-label={`Excluir ${customer.name}`} className="text-muted-foreground hover:text-destructive">
                              <Trash2 aria-hidden="true" />
                            </Button>
                          }
                          title={`Excluir ${customer.name}?`}
                          description="Só é possível excluir clientes sem pedidos — o histórico de vendas depende deles."
                          confirmLabel="Excluir"
                          action={deleteCustomer.bind(null, customer.id)}
                        />
                      )}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Pagination page={result.page} pageSize={result.pageSize} total={result.total} href={(page) => withQuery("/erp/clientes", { search: query.search }, { page })} />
    </div>
  );
}
