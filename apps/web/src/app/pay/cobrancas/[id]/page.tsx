import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { randomUUID } from "node:crypto";
import { ArrowLeft } from "@godzilla/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@godzilla/ui";
import { CopyButton, ExpiresCountdown, RefundForm, SimulatePaymentButton } from "@/components/pay/interactive";
import { ACCOUNT_LABELS, ChargeStatusBadge, DeliveryStatusBadge, EVENT_LABELS } from "@/components/pay/ui";
import { formatDateTime, money } from "@/lib/erp/format";
import { maskDocument } from "@/lib/erp/masks";
import { getCharge, getLedger, listDeliveries } from "@/lib/pay/queries";
import { pixQrSvg } from "@/lib/pay/qr";

export const metadata: Metadata = { title: "Cobrança" };

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-border py-2 text-body-sm last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{children}</dd>
    </div>
  );
}

export default async function ChargePage({ params }: PageProps<"/pay/cobrancas/[id]">) {
  const { id } = await params;
  const charge = await getCharge(id);
  if (!charge) notFound();
  const [ledger, deliveries, qr] = await Promise.all([getLedger(charge.id), listDeliveries(), charge.status === "pending" ? pixQrSvg(charge.brCode) : null]);
  const events = deliveries.filter((delivery) => delivery.chargeId === charge.id);
  const refundable = charge.status === "paid" || charge.status === "partially_refunded";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <Link href="/pay/cobrancas" className="inline-flex w-fit items-center gap-1 font-mono text-body-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Cobranças
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-h2 font-bold tracking-tight">{money(charge.amountCents)}</h1>
          <ChargeStatusBadge status={charge.status} />
        </div>
        {charge.description && <p className="text-muted-foreground">{charge.description}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle as="h2" className="text-body font-semibold">
              {charge.status === "pending" ? "Pague com Pix" : "Pix"}
            </CardTitle>
            {charge.status === "pending" ? (
              <CardDescription>
                Expira em <ExpiresCountdown expiresAt={charge.expiresAt} />. Ambiente de teste: use o botão abaixo em vez do app do banco.
              </CardDescription>
            ) : (
              <CardDescription>{charge.status === "expired" ? "Este Pix expirou e não pode mais ser pago." : `Pago em ${formatDateTime(charge.paidAt!)}.`}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {qr && (
              <div
                className="mx-auto w-full max-w-64 overflow-hidden rounded-lg bg-white p-2 [&_svg]:h-auto [&_svg]:w-full"
                role="img"
                aria-label="QR Code do Pix"
                data-testid="pix-qr"
                dangerouslySetInnerHTML={{ __html: qr }}
              />
            )}
            <div className="flex flex-col gap-2">
              <span className="text-body-sm font-medium">Pix copia e cola</span>
              <code className="max-h-28 overflow-y-auto break-all rounded-md border border-input bg-background px-3 py-2 font-mono text-caption" data-testid="br-code">
                {charge.brCode}
              </code>
              <div>
                <CopyButton value={charge.brCode} label="Copiar código" />
              </div>
            </div>
            {charge.status === "pending" && <SimulatePaymentButton chargeId={charge.id} />}
          </CardContent>
        </Card>

        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle as="h2" className="text-body font-semibold">
                Detalhes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl>
                <Row label="Valor">{money(charge.amountCents)}</Row>
                <Row label="Taxa (0,99%)">{money(charge.feeCents)}</Row>
                <Row label="Estornado">{money(charge.refundedCents)}</Row>
                <Row label="txid">
                  <span className="font-mono text-caption">{charge.txid}</span>
                </Row>
                {charge.customer && (
                  <Row label="Pagador">
                    {charge.customer.name}
                    {charge.customer.document && <span className="ml-2 font-mono text-caption text-muted-foreground">{maskDocument(charge.customer.document)}</span>}
                  </Row>
                )}
                <Row label="Criada">{formatDateTime(charge.createdAt)}</Row>
                <Row label="Validade">{formatDateTime(charge.expiresAt)}</Row>
              </dl>
            </CardContent>
          </Card>

          {refundable && (
            <Card>
              <CardHeader>
                <CardTitle as="h2" className="text-body font-semibold">
                  Estornar
                </CardTitle>
                <CardDescription>Total ou em parte. Só sai se a loja tiver saldo — dois estornos ao mesmo tempo nunca deixam o saldo negativo.</CardDescription>
              </CardHeader>
              <CardContent>
                <RefundForm chargeId={charge.id} remainingCents={charge.amountCents - charge.refundedCents} idempotencyKey={randomUUID()} />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <section className="flex flex-col gap-3" aria-labelledby="livro">
        <h2 id="livro" className="font-mono text-overline uppercase tracking-widest text-primary">
          Livro-caixa desta cobrança
        </h2>
        {ledger.length === 0 ? (
          <p className="text-body-sm text-muted-foreground">Nada lançado ainda: o livro-caixa só se move quando o Pix é pago ou estornado.</p>
        ) : (
          <Card className="p-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Operação</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead className="text-right">Débito</TableHead>
                  <TableHead className="text-right">Crédito</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.map((entry, index) => (
                  <TableRow key={`${entry.transactionId}-${index}`}>
                    <TableCell className="font-mono text-caption">
                      {entry.kind === "payment" ? "Pagamento" : "Estorno"} · {formatDateTime(entry.createdAt)}
                    </TableCell>
                    <TableCell>{ACCOUNT_LABELS[entry.account] ?? entry.account}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{entry.direction === "debit" ? money(entry.amountCents) : ""}</TableCell>
                    <TableCell className="text-right font-mono tabular-nums">{entry.direction === "credit" ? money(entry.amountCents) : ""}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="eventos">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="eventos" className="font-mono text-overline uppercase tracking-widest text-primary">
            Webhooks desta cobrança
          </h2>
          <Link href="/pay/webhooks" className="font-mono text-body-sm text-muted-foreground hover:text-primary">
            Ver todas as entregas →
          </Link>
        </div>
        <ul className="flex flex-col gap-2">
          {events.map((event) => (
            <li key={event.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 text-body-sm">
              <span>
                {EVENT_LABELS[event.eventType]} <span className="font-mono text-caption text-muted-foreground">{event.eventType}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="font-mono text-caption text-muted-foreground">
                  {event.attempts} tentativa{event.attempts === 1 ? "" : "s"}
                </span>
                <DeliveryStatusBadge status={event.status} />
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
