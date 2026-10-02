import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@godzilla/ui";
import { AccessRequestCard } from "@/components/erp/access-requests";
import { InvitesTable, MembersTable } from "@/components/erp/members-table";
import { CompanyForm, InviteForm } from "@/components/erp/team-manager";
import { PageHeader, StatCard } from "@/components/erp/ui";
import { formatDate, formatDateTime, money } from "@/lib/erp/format";
import { ownerAccessRequests, ownerCompanies, ownerInvites, ownerOverview, ownerUsers, requireAccount } from "@/lib/erp/queries";

export const metadata: Metadata = { title: "Painel do dono" };

/** Painel do dono do sistema: todas as empresas, todas as pessoas, convites e a demonstração pública. */
export default async function OwnerPage() {
  const session = await requireAccount("owner");
  const [overview, companies, users, invites, requests] = await Promise.all([ownerOverview(), ownerCompanies(), ownerUsers(), ownerInvites(), ownerAccessRequests()]);
  const companyOptions = companies.map((company) => ({ id: company.id, name: company.name }));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Painel do dono" description="Visão do sistema inteiro. Só você vê esta página." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Empresas" value={overview.companies} hint="contas de verdade" />
        <StatCard label="Pessoas" value={overview.users} hint={overview.blockedUsers ? `${overview.blockedUsers} bloqueada(s)` : "todas ativas"} />
        <StatCard label="Pedidos" value={overview.pendingRequests} hint="de acesso, aguardando você" tone={overview.pendingRequests ? "warning" : undefined} />
        <StatCard label="Convites" value={overview.pendingInvites} hint="pendentes" />
        <StatCard
          label="Demos ativas"
          value={`${overview.activeDemos}/${overview.demoCapacity}`}
          hint="empresas temporárias do portfólio"
          tone={overview.activeDemos >= overview.demoCapacity * 0.8 ? "warning" : undefined}
        />
      </div>

      <section className="flex flex-col gap-3" aria-labelledby="pedidos">
        <h2 id="pedidos" className="font-mono text-overline uppercase tracking-widest text-primary">
          Pedidos de acesso {requests.length > 0 && `(${requests.length})`}
        </h2>
        {requests.length === 0 ? (
          <p className="text-body-sm text-muted-foreground">
            Nenhum pedido pendente. O link público para pedir acesso é <span className="font-mono text-foreground">/erp/solicitar-acesso</span>.
          </p>
        ) : (
          <ul className="grid gap-4 lg:grid-cols-2">
            {requests.map((request) => (
              <li key={request.id}>
                <AccessRequestCard request={request} companies={companyOptions} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-overline uppercase tracking-widest text-primary">Empresas</h2>
        <Card className="p-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead className="text-right">Pessoas</TableHead>
                <TableHead className="text-right">Produtos</TableHead>
                <TableHead className="text-right">Vendas</TableHead>
                <TableHead className="text-right">Faturamento</TableHead>
                <TableHead>Desde</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {companies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">
                    {company.name}
                    {company.id === session.workspace.id && <span className="ml-2 text-caption text-muted-foreground">(sua)</span>}
                  </TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{company.users}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{company.products}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{company.orders}</TableCell>
                  <TableCell className="text-right font-mono tabular-nums">{money(company.revenueCents)}</TableCell>
                  <TableCell className="font-mono text-caption text-muted-foreground">{formatDate(company.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle as="h3" className="text-body font-semibold">
              Nova empresa
            </CardTitle>
            <CardDescription>Cria a empresa vazia. Depois, convide o administrador dela logo abaixo.</CardDescription>
          </CardHeader>
          <CardContent>
            <CompanyForm />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle as="h2" className="text-body font-semibold">
            Convidar para qualquer empresa
          </CardTitle>
          <CardDescription>O link aparece uma vez só: copie ou mande pelo WhatsApp. Vale 48 horas e funciona uma vez.</CardDescription>
        </CardHeader>
        <CardContent>
          <InviteForm scope="owner" companies={companyOptions} />
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-overline uppercase tracking-widest text-primary">Todas as pessoas</h2>
        <MembersTable members={users} scope="owner" currentUserId={session.user!.id} showCompany />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-overline uppercase tracking-widest text-primary">Convites pendentes</h2>
        <InvitesTable invites={invites} scope="owner" showCompany />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-overline uppercase tracking-widest text-primary">Últimos acessos</h2>
        {overview.lastLogins.length === 0 ? (
          <p className="text-body-sm text-muted-foreground">Ninguém entrou ainda.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-body-sm">
            {overview.lastLogins.map((entry) => (
              <li key={`${entry.email}-${entry.at}`} className="flex flex-wrap justify-between gap-2 border-b border-border py-2">
                <span>
                  {entry.name} <span className="font-mono text-caption text-muted-foreground">· {entry.workspace}</span>
                </span>
                <span className="font-mono text-caption text-muted-foreground">{formatDateTime(entry.at)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
