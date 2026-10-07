import type { Metadata } from "next";
import { ArrowUpRight } from "@godzilla/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@godzilla/ui";
import { PageHeader } from "@/components/erp/ui";
import { CopyButton, SecretValue } from "@/components/pay/interactive";
import { getMerchant, requirePaySession } from "@/lib/pay/queries";

export const metadata: Metadata = { title: "Integração" };

function Snippet({ title, description, code }: { title: string; description?: string; code: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h2" className="text-body font-semibold">
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <pre className="overflow-x-auto rounded-md border border-input bg-background p-3 font-mono text-caption">{code}</pre>
        <div>
          <CopyButton value={code} />
        </div>
      </CardContent>
    </Card>
  );
}

/** Para quem quer testar a API direto (curl, Postman, Swagger) com a chave da própria loja. */
export default async function IntegrationPage() {
  const [session, merchant] = await Promise.all([requirePaySession(), getMerchant()]);
  const api = process.env.ERP_API_URL?.replace(/\/$/, "") ?? "https://portfolio-api-psi-one.vercel.app";

  const create = `curl -X POST ${api}/pay/charges \\
  -H "Authorization: Bearer $GODZILLA_PAY_KEY" \\
  -H "Idempotency-Key: pedido-1042" \\
  -H "Content-Type: application/json" \\
  -d '{"amountCents": 12345, "description": "Pedido 1042"}'`;
  const simulate = `curl -X POST ${api}/pay/charges/<id>/simulate-payment \\
  -H "Authorization: Bearer $GODZILLA_PAY_KEY"`;
  const refund = `curl -X POST ${api}/pay/charges/<id>/refunds \\
  -H "Authorization: Bearer $GODZILLA_PAY_KEY" \\
  -H "Idempotency-Key: estorno-1042" \\
  -H "Content-Type: application/json" \\
  -d '{"amountCents": 2000}'`;
  const verify = `import { createHmac, timingSafeEqual } from "node:crypto";

// Express: app.post("/webhooks/godzilla", express.raw({ type: "application/json" }), handler)
export function isFromGodzillaPay(rawBody: string, header: string, secret: string) {
  const parts = Object.fromEntries(header.split(",").map((part) => part.split("=")));
  const age = Math.abs(Date.now() / 1000 - Number(parts.t));
  if (!parts.v1 || !(age < 300)) return false; // velho demais: pode ser reenvio malicioso
  const expected = createHmac("sha256", secret).update(\`\${parts.t}.\${rawBody}\`).digest("hex");
  return expected.length === parts.v1.length && timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
}`;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Integração"
        description="Use a API direto, como um lojista faria. Esta chave é só desta loja de teste e para de funcionar quando ela expira."
        actions={
          <a
            href={`${api}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-body-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            Swagger
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </a>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle as="h2" className="text-body font-semibold">
            Credenciais da {merchant.name}
          </CardTitle>
          <CardDescription>A API guarda só o hash da chave: se perder, crie outra loja. No Swagger, clique em Authorize e cole a chave.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <SecretValue label="Chave de API" value={session.apiKey} />
          <SecretValue label="Segredo dos webhooks" value={merchant.webhookSecret} />
          <div className="flex flex-col gap-2">
            <span className="text-body-sm font-medium">URL da API</span>
            <div className="flex flex-wrap items-center gap-2">
              <code className="rounded-md border border-input bg-background px-3 py-2 font-mono text-caption">{api}</code>
              <CopyButton value={api} />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Snippet title="Criar cobrança" description="Repita com a mesma Idempotency-Key: volta a mesma cobrança, com o cabeçalho Idempotent-Replayed." code={create} />
        <Snippet title="Simular o pagamento" description="Só no ambiente de teste: faz de conta que o banco do pagador confirmou o Pix." code={simulate} />
        <Snippet title="Estornar" description="Sem valor, estorna tudo o que resta." code={refund} />
        <Snippet title="Conferir a assinatura do webhook (Node.js)" description="Use o corpo cru, antes de qualquer JSON.parse." code={verify} />
      </div>
    </div>
  );
}
