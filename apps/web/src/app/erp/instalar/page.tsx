import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader } from "@godzilla/ui";
import { SetupForm } from "@/components/erp/account-forms";
import { setupAvailable } from "@/lib/erp/queries";

export const metadata: Metadata = { title: "Instalar", robots: { index: false } };

/** Só existe enquanto não houver dono do sistema (e exige o token do servidor). */
export default async function SetupPage() {
  if (!(await setupAvailable())) notFound();
  return (
    <Card className="mx-auto w-full max-w-xl">
      <CardHeader>
        <h1 className="text-h3 font-bold tracking-tight">Instalar o GODZILLA ERP</h1>
        <CardDescription>
          Cria a sua empresa e a sua conta de dono do sistema. Funciona uma vez só — depois, o acesso de outras pessoas é por convite.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SetupForm />
      </CardContent>
    </Card>
  );
}
