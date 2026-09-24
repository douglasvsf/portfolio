"use client";

import { Button, Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@godzilla/ui";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <Card className="mx-auto mt-12 w-full max-w-xl">
      <CardHeader>
        <CardTitle>Não foi possível carregar o mercado</CardTitle>
        <CardDescription>{error.message || "A brapi não respondeu. Tente novamente em instantes."}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button onClick={() => retry()}>Tentar novamente</Button>
      </CardFooter>
    </Card>
  );
}
