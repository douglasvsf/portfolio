import type { Metadata } from "next";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader } from "@godzilla/ui";
import { AccessRequestForm } from "@/components/erp/access-requests";

export const metadata: Metadata = { title: "Solicitar acesso" };

/** Pedido público de acesso: vai para o painel do dono, que aprova (gerando um convite) ou recusa. */
export default function RequestAccessPage() {
  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <h1 className="text-h3 font-bold tracking-tight">Solicitar acesso</h1>
        <CardDescription>
          O acesso ao GODZILLA ERP é por convite. Deixe seus dados: se o pedido for aprovado, você recebe um link para criar sua senha. Só quer conhecer?{" "}
          <Link href="/erp" className="text-primary underline-offset-4 hover:underline">
            Use a demonstração
          </Link>
          .
        </CardDescription>
      </CardHeader>
      <CardContent>
        <AccessRequestForm />
      </CardContent>
    </Card>
  );
}
