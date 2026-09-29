import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader } from "@godzilla/ui";
import { ResetPasswordForm } from "@/components/erp/account-forms";
import { formatDateTime } from "@/lib/erp/format";
import { previewReset } from "@/lib/erp/queries";

export const metadata: Metadata = { title: "Nova senha", robots: { index: false }, referrer: "no-referrer" };

export default async function ResetPage({ params }: PageProps<"/erp/redefinir/[token]">) {
  const { token } = await params;
  const reset = await previewReset(token);
  return (
    <Card className="mx-auto w-full max-w-xl">
      {reset ? (
        <>
          <CardHeader>
            <h1 className="text-h3 font-bold tracking-tight">Crie uma senha nova</h1>
            <CardDescription>
              Olá, {reset.name}. Este link vale até {formatDateTime(reset.expiresAt)} e funciona uma vez. Ao salvar, as outras sessões abertas são encerradas.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResetPasswordForm token={token} email={reset.email} />
          </CardContent>
        </>
      ) : (
        <CardHeader>
          <h1 className="text-h3 font-bold tracking-tight">Link inválido</h1>
          <CardDescription>
            Este link já foi usado ou venceu. Peça um novo ao administrador da sua empresa.{" "}
            <Link href="/erp" className="text-primary underline-offset-4 hover:underline">
              Ir para a entrada
            </Link>
          </CardDescription>
        </CardHeader>
      )}
    </Card>
  );
}
