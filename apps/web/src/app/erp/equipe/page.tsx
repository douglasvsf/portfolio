import type { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@godzilla/ui";
import { InvitesTable, MembersTable } from "@/components/erp/members-table";
import { InviteForm } from "@/components/erp/team-manager";
import { PageHeader } from "@/components/erp/ui";
import { getTeam, requireAccount } from "@/lib/erp/queries";

export const metadata: Metadata = { title: "Equipe" };

export default async function TeamPage() {
  const session = await requireAccount("admin");
  const team = await getTeam();
  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="Equipe" description={`Quem acessa ${session.workspace.name}. Acesso só por convite; bloquear derruba a sessão da pessoa na hora.`} />

      <Card>
        <CardHeader>
          <CardTitle as="h2" className="text-body font-semibold">
            Convidar pessoa
          </CardTitle>
          <CardDescription>O link aparece aqui uma vez só: copie ou mande pelo WhatsApp. Vale 48 horas e funciona uma vez.</CardDescription>
        </CardHeader>
        <CardContent>
          <InviteForm scope="team" />
        </CardContent>
      </Card>

      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-overline uppercase tracking-widest text-primary">Pessoas com acesso</h2>
        <MembersTable members={team.members} scope="team" currentUserId={session.user!.id} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-overline uppercase tracking-widest text-primary">Convites pendentes</h2>
        <InvitesTable invites={team.invites} scope="team" />
      </section>
    </div>
  );
}
