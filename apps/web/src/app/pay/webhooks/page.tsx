import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, AlertTriangle } from "@godzilla/icons";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@godzilla/ui";
import { PageHeader } from "@/components/erp/ui";
import { AutoRefresh, RetryButton, WebhookSettingsForm } from "@/components/pay/interactive";
import { DeliveryStatusBadge, EVENT_LABELS } from "@/components/pay/ui";
import { formatDateTime } from "@/lib/erp/format";
import { getMerchant, listDeliveries, listInspector } from "@/lib/pay/queries";

export const metadata: Metadata = { title: "Webhooks" };

const pretty = (body: string) => {
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
};

export default async function WebhooksPage() {
  // Listar as entregas já processa as vencidas (a API tenta antes de responder).
  const deliveries = await listDeliveries();
  const [merchant, received] = await Promise.all([getMerchant(), listInspector()]);
  const waiting = deliveries.some((delivery) => delivery.status === "pending");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Webhooks"
        description="Cada evento entra numa fila no PostgreSQL na mesma transação que muda a cobrança. Se o destino falha, novas tentativas em 30 s, 2 min, 10 min, 1 h e 6 h."
        actions={<AutoRefresh active={waiting} />}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle as="h2" className="text-body font-semibold">
              Configuração
            </CardTitle>
            <CardDescription>
              Assinatura no cabeçalho <code className="font-mono">Godzilla-Signature</code> (HMAC-SHA256). O segredo está em{" "}
              <Link href="/pay/integracao" className="text-primary underline-offset-4 hover:underline">
                Integração
              </Link>
              .
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WebhookSettingsForm merchant={merchant} />
          </CardContent>
        </Card>

        <section className="flex min-w-0 flex-col gap-3" aria-labelledby="entregas">
          <h2 id="entregas" className="font-mono text-overline uppercase tracking-widest text-primary">
            Entregas
          </h2>
          {deliveries.length === 0 ? (
            <p className="text-body-sm text-muted-foreground">
              Nenhum evento ainda.{" "}
              <Link href="/pay/cobrancas" className="text-primary underline-offset-4 hover:underline">
                Gere uma cobrança
              </Link>{" "}
              para ver o primeiro.
            </p>
          ) : (
            <ul className="flex flex-col gap-3" data-testid="deliveries">
              {deliveries.map((delivery) => (
                <li key={delivery.id}>
                  <Card className="flex flex-col gap-3 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="font-medium">{EVENT_LABELS[delivery.eventType]}</span>
                        <span className="font-mono text-caption text-muted-foreground">
                          {delivery.eventType} · {formatDateTime(delivery.createdAt)} · {delivery.url}
                        </span>
                      </div>
                      <DeliveryStatusBadge status={delivery.status} />
                    </div>
                    <ol className="flex flex-col gap-1 border-l-2 border-border pl-3 font-mono text-caption">
                      {delivery.history.map((attempt, index) => (
                        <li key={attempt.at} className={attempt.statusCode !== null && attempt.statusCode < 300 ? "text-success" : "text-destructive"}>
                          tentativa {index + 1} · {formatDateTime(attempt.at)} · {attempt.statusCode ? `HTTP ${attempt.statusCode}` : (attempt.error ?? "sem resposta")} · {attempt.durationMs} ms
                        </li>
                      ))}
                      {delivery.status === "pending" && delivery.nextAttemptAt && (
                        <li className="text-muted-foreground">próxima tentativa {formatDateTime(delivery.nextAttemptAt)}</li>
                      )}
                    </ol>
                    {delivery.status !== "delivered" && <RetryButton deliveryId={delivery.id} />}
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="flex flex-col gap-3" aria-labelledby="inspetor">
        <h2 id="inspetor" className="font-mono text-overline uppercase tracking-widest text-primary">
          Inspetor da loja
        </h2>
        <p className="max-w-3xl text-body-sm text-muted-foreground">
          O que chegou ao destino padrão. Ele confere a assinatura com o segredo da loja, como o seu servidor deveria fazer, antes de confiar no evento.
        </p>
        {received.length === 0 ? (
          <p className="text-body-sm text-muted-foreground">Nada recebido ainda.</p>
        ) : (
          <ul className="grid gap-3 lg:grid-cols-2" data-testid="inspector">
            {received.slice(0, 10).map((item) => (
              <li key={item.id} className="min-w-0">
                <Card className="flex h-full flex-col gap-2 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-body-sm">
                      POST · {item.eventType} · {formatDateTime(item.receivedAt)}
                    </span>
                    <span className="flex gap-1.5">
                      <Badge variant={item.respondedStatus < 300 ? "success" : "destructive"}>HTTP {item.respondedStatus}</Badge>
                      <Badge variant={item.signatureValid ? "outline" : "destructive"} className="gap-1">
                        {item.signatureValid ? <CheckCircle2 className="size-3" aria-hidden="true" /> : <AlertTriangle className="size-3" aria-hidden="true" />}
                        {item.signatureValid ? "assinatura confere" : "assinatura inválida"}
                      </Badge>
                    </span>
                  </div>
                  <code className="break-all font-mono text-caption text-muted-foreground">godzilla-signature: {item.headers["godzilla-signature"]}</code>
                  <pre className="max-h-56 overflow-auto rounded-md border border-input bg-background p-3 font-mono text-caption">{pretty(item.body)}</pre>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
