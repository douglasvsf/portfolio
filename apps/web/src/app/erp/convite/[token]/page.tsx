import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader } from "@godzilla/ui";
import { erp } from "@portfolio/shared";
import { AcceptInviteForm } from "@/components/erp/account-forms";
import { formatDateTime } from "@/lib/erp/format";
import { previewInvite } from "@/lib/erp/queries";

export const metadata: Metadata = { title: "Convite", robots: { index: false }, referrer: "no-referrer" };

export default async function InvitePage({ params }: PageProps<"/erp/convite/[token]">) {
  const { token } = await params;
  const invite = await previewInvite(token);
  return (
    <Card className="mx-auto w-full max-w-xl">
      {invite ? (
        <>
          <CardHeader>
            <h1 className="text-h3 font-bold tracking-tight">Você foi convidado</h1>
            <CardDescription>
              Acesso a <strong className="text-foreground">{invite.workspace.name}</strong> como{" "}
              <strong className="text-foreground">{erp.ROLE_LABELS[invite.role]}</strong>. Convite válido até {formatDateTime(invite.expiresAt)}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AcceptInviteForm token={token} email={invite.email} />
          </CardContent>
        </>
      ) : (
        <CardHeader>
          <h1 className="text-h3 font-bold tracking-tight">Convite inválido</h1>
          <CardDescription>
            Este link já foi usado, venceu ou foi cancelado. Peça um convite novo a quem convidou você.{" "}
            <Link href="/erp" className="text-primary underline-offset-4 hover:underline">
              Ir para a entrada
            </Link>
          </CardDescription>
        </CardHeader>
      )}
    </Card>
  );
}
