import { redirect } from "next/navigation";
import { ArrowUpRight, BookOpen, KeyRound, QrCode, ShieldCheck, Webhook } from "@godzilla/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@godzilla/ui";
import { SandboxEntry } from "@/components/pay/interactive";
import { currentPaySession } from "@/lib/pay/queries";

const FEATURES = [
  { icon: QrCode, title: "Pix no padrão do Banco Central", text: "Cada cobrança gera o BR Code (copia e cola) e o QR Code no formato EMV, com CRC16 — o mesmo que o app do banco lê." },
  { icon: BookOpen, title: "Livro-caixa de partidas dobradas", text: "Todo pagamento e estorno vira lançamento de débito e crédito. O PostgreSQL recusa, no COMMIT, qualquer transação desbalanceada." },
  { icon: KeyRound, title: "Idempotência de verdade", text: "Repetir a requisição com a mesma Idempotency-Key devolve o mesmo resultado — clique duplo não cobra duas vezes." },
  { icon: Webhook, title: "Webhooks assinados com novas tentativas", text: "Eventos assinados com HMAC, fila no próprio banco e espera crescente quando o destino falha. Veja tudo no inspetor." },
  { icon: ShieldCheck, title: "Concorrência sob controle", text: "Quinze confirmações do mesmo Pix ao mesmo tempo: uma passa. Estornos simultâneos nunca deixam o saldo negativo." },
];

export default async function PayHome({ searchParams }: PageProps<"/pay">) {
  const { expirou } = await searchParams;
  if ((await currentPaySession()) && !expirou) redirect("/pay/cobrancas");
  const docsUrl = process.env.ERP_API_URL ? new URL("/docs", process.env.ERP_API_URL).toString() : undefined;

  return (
    <div className="flex flex-col gap-12 py-8">
      <section className="flex max-w-3xl flex-col gap-5">
        <span className="font-mono text-body-sm text-primary">$ pay --sandbox</span>
        <h1 className="text-glow text-display font-black leading-tight tracking-tight">
          GODZILLA <span className="text-primary">Pay</span>
        </h1>
        <p className="text-body-lg text-muted-foreground">
          Um gateway Pix de demonstração para testar de ponta a ponta: crie cobranças, simule o pagamento, estorne e acompanhe os webhooks — com API
          em NestJS e regras de dinheiro garantidas pelo PostgreSQL.
        </p>
        {expirou && (
          <p role="status" className="text-body-sm text-warning">
            Sua loja de teste expirou ou foi encerrada. Crie outra para continuar.
          </p>
        )}
        <SandboxEntry />
        <p className="text-caption text-muted-foreground">Nenhum dinheiro de verdade: o QR Code usa uma chave Pix aleatória e o pagamento é simulado.</p>
        {docsUrl && (
          <a
            href={docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-fit items-center gap-1 font-mono text-body-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            Ver a API (Swagger)
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </a>
        )}
      </section>

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <li key={title}>
            <Card className="h-full">
              <CardHeader>
                <Icon className="size-6 text-primary" aria-hidden="true" />
                <CardTitle as="h2" className="text-body font-semibold">
                  {title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{text}</CardDescription>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
