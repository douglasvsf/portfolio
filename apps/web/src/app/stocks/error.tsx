"use client";

import { Button, Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@godzilla/ui";
import { useStocksDictionary } from "@/content/stocks";

/** Erro amigável — nunca mostra a mensagem técnica ao visitante. */
export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const { states } = useStocksDictionary();
  return (
    <Card className="mx-auto mt-12 w-full max-w-xl">
      <CardHeader>
        <CardTitle>{states.errorTitle}</CardTitle>
        <CardDescription>{states.errorDescription}</CardDescription>
      </CardHeader>
      <CardFooter>
        <Button onClick={() => retry()}>{states.retry}</Button>
      </CardFooter>
    </Card>
  );
}
