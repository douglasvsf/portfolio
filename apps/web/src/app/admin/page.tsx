import { LogOut } from "@godzilla/icons";
import { Card, CardContent, CardDescription, CardHeader } from "@godzilla/ui";
import { AdminLoginForm } from "@/components/admin/admin-login";
import { ContactMessageCard } from "@/components/admin/contact-messages";
import { adminLogout } from "@/lib/admin/actions";
import { adminPanel } from "@/lib/admin/queries";

/** Painel do site: as mensagens que chegam pelo formulário de contato. Sem sessão, mostra o login. */
export default async function AdminPage() {
  const panel = await adminPanel();

  if (!panel) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <h1 className="text-h4 font-semibold">Painel do site</h1>
          <CardDescription>Área restrita ao dono do portfólio.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminLoginForm />
        </CardContent>
      </Card>
    );
  }

  const { session, messages } = panel;
  const unread = messages.filter((message) => message.status === "new").length;
  const byKind = (kind: string) => messages.filter((message) => message.kind === kind).length;
  const stats = [
    { label: "Não lidas", value: unread, highlight: unread > 0 },
    { label: "Vagas", value: byKind("job") },
    { label: "Freelances", value: byKind("freelance") },
    { label: "Total", value: messages.length },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-h3 font-semibold">Painel do site</h1>
          <p className="text-body-sm text-muted-foreground">Mensagens que chegam pelo formulário de contato do portfólio.</p>
        </div>
        <form action={adminLogout} className="flex items-center gap-3 text-body-sm">
          <span className="font-mono text-muted-foreground">{session.name}</span>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-sm font-mono text-caption text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-2 focus-visible:outline-primary"
          >
            <LogOut className="size-3.5" aria-hidden="true" />
            Sair
          </button>
        </form>
      </div>

      <dl className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex flex-col gap-1 p-5">
            <dt className="font-mono text-caption uppercase tracking-wider text-muted-foreground">{stat.label}</dt>
            <dd className={stat.highlight ? "font-mono text-h3 font-semibold tabular-nums text-primary" : "font-mono text-h3 font-semibold tabular-nums"}>{stat.value}</dd>
          </Card>
        ))}
      </dl>

      <section className="flex flex-col gap-3" aria-labelledby="mensagens">
        <h2 id="mensagens" className="font-mono text-overline uppercase tracking-widest text-primary">
          Mensagens de contato
        </h2>
        {messages.length === 0 ? (
          <p className="text-body-sm text-muted-foreground">Nenhuma mensagem ainda. Elas chegam pelo formulário da seção Contato do site.</p>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {messages.map((message) => (
              <li key={message.id}>
                <ContactMessageCard message={message} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
