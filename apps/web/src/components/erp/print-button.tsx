"use client";

import { Printer } from "@godzilla/icons";
import { Button } from "@godzilla/ui";

export function PrintButton() {
  return (
    <Button onClick={() => window.print()} className="print:hidden">
      <Printer aria-hidden="true" /> Imprimir / salvar PDF
    </Button>
  );
}
