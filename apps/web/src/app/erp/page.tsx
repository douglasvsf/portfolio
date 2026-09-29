import { redirect } from "next/navigation";
import { ArrowUpRight, Boxes, FileCheck2, Lock, RefreshCw, Users } from "@godzilla/icons";
import { Card } from "@godzilla/ui";
import { DemoEntry } from "@/components/erp/demo-entry";
import { getSession } from "@/lib/erp/session";

const FEATURES = [
  { icon: Users, title: "Uma empresa só sua", text: "Cada visitante ganha um mercado isolado, com 40 produtos, 12 clientes e 6 meses de pedidos. Tudo some sozinho em 24h." },
  { icon: RefreshCw, title: "Estoque que não mente", text: "Confirmar um pedido baixa o estoque numa transação: ou todos os itens saem, ou nenhum. O saldo nunca fica negativo." },
  { icon: Lock, title: "Admin e Vendedor", text: "Troque de papel e veja as permissões mudarem — o vendedor não altera preço nem movimenta estoque." },
  { icon: FileCheck2, title: "Contratos compartilhados", text: "O mesmo schema Zod valida o formulário aqui e a requisição na API em NestJS." },
];

export default async function ErpHome({ searchParams }: PageProps<"/erp">) {
  const { expirou } = await searchParams;
  if ((await getSession()) && !expirou) redirect("/erp/dashboard");
  const docsUrl = process.env.ERP_API_URL ? new URL("/docs", process.env.ERP_API_URL).toString() : undefined;

  return (
    <div className="flex flex-col gap-12 py-8">
      <section className="flex max-w-3xl flex-col gap-5">
        <span className="font-mono text-body-sm text-primary">$ erp --demo</span>
        <h1 className="text-glow text-display font-black leading-tight tracking-tight">
          GODZILLA <span className="text-primary">ERP</span>
        </h1>
        <p className="text-body-lg text-muted-foreground">
          Um mini-ERP de mercado para testar de verdade: produtos, estoque, clientes, pedidos e dashboard — com API em NestJS, MongoDB e
          regras de negócio de sistema real.
        </p>
        {expirou && (
          <p role="status" className="text-body-sm text-warning">
            Sua demonstração expirou ou foi encerrada. Entre de novo para ganhar uma empresa nova.
          </p>
        )}
        <DemoEntry />
        {docsUrl && (
          <a href={docsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex w-fit items-center gap-1 font-mono text-body-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline">
            Ver a API (Swagger)
            <ArrowUpRight className="size-3.5" aria-hidden="true" />
          </a>
        )}
      </section>

      <ul className="grid gap-4 sm:grid-cols-2">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <li key={title}>
            <Card className="flex h-full gap-4 p-5">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-background text-primary">
                <Icon className="size-(--size-icon-md)" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1">
                <h2 className="font-semibold">{title}</h2>
                <p className="text-body-sm text-muted-foreground">{text}</p>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <p className="flex items-center gap-2 text-caption text-muted-foreground">
        <Boxes className="size-3.5 text-primary" aria-hidden="true" />
        Dados fictícios. Documentos (CPF/CNPJ) gerados apenas para a demonstração.
      </p>
    </div>
  );
}
