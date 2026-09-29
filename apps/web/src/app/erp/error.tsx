"use client";

import { Button, Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@godzilla/ui";
import { useReportError } from "@/lib/observability/use-report-error";

/** API fora do ar ou erro inesperado: mensagem amigável, sem detalhe técnico. */
export default function ErpError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useReportError(error);
  return (
    <Card className="mx-auto mt-12 w-full max-w-xl">
      <CardHeader>
        <CardTitle as="h2">Não foi possível carregar o ERP</CardTitle>
        <CardDescription>A API não respondeu agora. Tente de novo em instantes.</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button onClick={() => retry()}>Tentar novamente</Button>
      </CardFooter>
    </Card>
  );
}
