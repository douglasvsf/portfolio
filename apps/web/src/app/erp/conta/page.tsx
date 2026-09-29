import type { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@godzilla/ui";
import { erp } from "@portfolio/shared";
import { ChangePasswordForm } from "@/components/erp/account-forms";
import { PageHeader } from "@/components/erp/ui";
import { requireAccount } from "@/lib/erp/queries";

export const metadata: Metadata = { title: "Minha conta" };

export default async function AccountPage() {
  const session = await requireAccount();
  const user = session.user!;
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Minha conta" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle as="h2" className="text-body font-semibold">
              Dados de acesso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-body-sm">
              <dt className="text-muted-foreground">Nome</dt>
              <dd>{user.name}</dd>
              <dt className="text-muted-foreground">E-mail</dt>
              <dd className="font-mono">{user.email}</dd>
              <dt className="text-muted-foreground">Empresa</dt>
              <dd>{session.workspace.name}</dd>
              <dt className="text-muted-foreground">Papel</dt>
              <dd>{user.isOwner ? "Dono do sistema · Administrador" : erp.ROLE_LABELS[session.role]}</dd>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle as="h2" className="text-body font-semibold">
              Trocar senha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChangePasswordForm />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
