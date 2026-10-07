import type { Metadata } from "next";
import Link from "next/link";
import { randomUUID } from "node:crypto";
import { CheckCircle2, AlertTriangle } from "@godzilla/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@godzilla/ui";
import { pay } from "@portfolio/shared";
import { ChargeForm } from "@/components/pay/interactive";
import { ChargeStatusBadge } from "@/components/pay/ui";
import { EmptyState, FilterLink, PageHeader, Pagination, StatCard, withQuery } from "@/components/erp/ui";
import { formatDateTime, money } from "@/lib/erp/format";
import { getBalance, listCharges } from "@/lib/pay/queries";

export const metadata: Metadata = { title: "Cobranças" };

export default async function ChargesPage({ searchParams }: PageProps<"/pay/cobrancas">) {
  const params = await searchParams;
  const status = typeof params.status === "string" && (pay.CHARGE_STATUSES as readonly string[]).includes(params.status) ? params.status : undefined;
  const page = Math.max(1, Number(params.page) || 1);
  const [balance, charges] = await Promise.all([getBalance(), listCharges({ status, page })]);
  const current = { status, page: String(page) };

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Cobranças" description="Gere um Pix, simule o pagamento e estorne. O saldo vem do livro-caixa, não de um campo que alguém atualiza." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Disponível" value={money(balance.availableCents)} hint="saldo da loja no livro-caixa" />
        <StatCard label="Recebido" value={money(balance.grossCents)} hint="cobranças pagas" />
        <StatCard label="Taxas" value={money(balance.feesCents)} hint={`${(pay.FEE_BASIS_POINTS / 100).toLocaleString("pt-BR")}% por Pix pago`} />
        <StatCard label="Estornado" value={money(balance.refundedCents)} hint="devolvido aos pagadores" />
      </div>
      <p className={balance.ledgerBalanced ? "flex items-center gap-2 text-body-sm text-success" : "flex items-center gap-2 text-body-sm text-destructive"} data-testid="ledger-check">
        {balance.ledgerBalanced ? <CheckCircle2 className="size-4" aria-hidden="true" /> : <AlertTriangle className="size-4" aria-hidden="true" />}
        {balance.ledgerBalanced ? "Livro-caixa da plataforma balanceado: débitos = créditos." : "Livro-caixa desbalanceado!"}
      </p>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle as="h2" className="text-body font-semibold">
              Nova cobrança Pix
            </CardTitle>
            <CardDescription>O QR Code e o copia e cola saem na hora.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChargeForm idempotencyKey={randomUUID()} />
          </CardContent>
        </Card>

        <section className="flex min-w-0 flex-col gap-3" aria-labelledby="lista">
          <h2 id="lista" className="sr-only">
            Lista de cobranças
          </h2>
          <nav aria-label="Filtrar por situação" className="flex flex-wrap gap-2">
            <FilterLink href={withQuery("/pay/cobrancas", current, { status: undefined, page: undefined })} active={!status}>
              Todas
            </FilterLink>
            {pay.CHARGE_STATUSES.map((option) => (
              <FilterLink key={option} href={withQuery("/pay/cobrancas", current, { status: option, page: undefined })} active={status === option}>
                {pay.CHARGE_STATUS_LABELS[option]}
              </FilterLink>
            ))}
          </nav>
          {charges.items.length === 0 ? (
            <EmptyState>{status ? "Nenhuma cobrança nesta situação." : "Nenhuma cobrança ainda. Gere a primeira ao lado."}</EmptyState>
          ) : (
            <Card className="p-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cobrança</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Criada</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {charges.items.map((charge) => (
                    <TableRow key={charge.id}>
                      <TableCell>
                        <Link href={`/pay/cobrancas/${charge.id}`} className="flex flex-col font-medium hover:text-primary">
                          {charge.description ?? "Cobrança Pix"}
                          <span className="font-mono text-caption text-muted-foreground">{charge.txid.slice(0, 12)}…</span>
                        </Link>
                      </TableCell>
                      <TableCell>
                        <ChargeStatusBadge status={charge.status} />
                      </TableCell>
                      <TableCell className="text-right font-mono tabular-nums">{money(charge.amountCents)}</TableCell>
                      <TableCell className="font-mono text-caption text-muted-foreground">{formatDateTime(charge.createdAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
          <Pagination page={charges.page} pageSize={charges.pageSize} total={charges.total} href={(target) => withQuery("/pay/cobrancas", current, { page: target })} />
        </section>
      </div>
    </div>
  );
}
