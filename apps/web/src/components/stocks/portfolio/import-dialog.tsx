"use client";

import { useState, type ChangeEvent } from "react";
import { FileSpreadsheet } from "@godzilla/icons";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Label,
  Spinner,
  useLocale,
} from "@godzilla/ui";
import { useStocksDictionary } from "@/content/stocks";
import { plural } from "@/i18n/message";
import { parseB3Rows, type B3ImportResult } from "@/lib/portfolio/b3-import";
import type { Transaction } from "@/lib/portfolio/schema";

type State = { step: "idle" } | { step: "reading" } | { step: "error"; message: string } | { step: "preview"; result: B3ImportResult };

/**
 * Importa a planilha da Área do Investidor da B3. O leitor de .xlsx só é
 * baixado quando o usuário escolhe um arquivo, e o arquivo nunca sai do
 * navegador.
 */
export function ImportDialog({ onImport }: { onImport: (transactions: Transaction[]) => { added: number; duplicates: number } }) {
  const { importer, actions } = useStocksDictionary().portfolio;
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<State>({ step: "idle" });
  const [feedback, setFeedback] = useState<string | null>(null);

  async function read(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setState({ step: "reading" });
    try {
      const { readSheet } = await import("read-excel-file/browser");
      const result = parseB3Rows(await readSheet(file));
      setState(result.format ? { step: "preview", result } : { step: "error", message: importer.unknownFormat });
    } catch {
      setState({ step: "error", message: importer.readError });
    }
  }

  function confirm() {
    if (state.step !== "preview") return;
    const { added, duplicates } = onImport(state.result.transactions);
    // "0 operações importadas" não ajuda (e o pt-BR trata 0 como singular): mostra só o que houve.
    setFeedback([added ? plural(importer.done, added, locale) : null, duplicates ? plural(importer.duplicates, duplicates, locale) : null].filter(Boolean).join(" · "));
    setOpen(false);
    setState({ step: "idle" });
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) setFeedback(null);
          else setState({ step: "idle" });
        }}
      >
        <DialogTrigger asChild>
          <Button variant="outline">
            <FileSpreadsheet aria-hidden="true" />
            {actions.import}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{importer.title}</DialogTitle>
            <DialogDescription>{importer.description}</DialogDescription>
          </DialogHeader>

          <ol className="mt-4 flex list-decimal flex-col gap-1 pl-5 text-body-sm text-muted-foreground">
            {importer.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>

          <div className="mt-4 flex flex-col gap-1.5">
            <Label htmlFor="b3-file">{importer.file}</Label>
            <input
              id="b3-file"
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={read}
              aria-describedby="b3-file-hint"
              className="text-body-sm file:mr-3 file:rounded-md file:border file:border-input file:bg-card file:px-3 file:py-1.5 file:font-mono file:text-foreground"
            />
            <p id="b3-file-hint" className="text-caption text-muted-foreground">
              {importer.localOnly}
            </p>
          </div>

          <div aria-live="polite" className="mt-4">
            {state.step === "reading" && (
              <p className="flex items-center gap-2 text-body-sm text-muted-foreground">
                <Spinner size="sm" /> {importer.reading}
              </p>
            )}
            {state.step === "error" && (
              <p role="alert" className="text-body-sm text-destructive">
                {state.message}
              </p>
            )}
            {state.step === "preview" && (
              <div className="flex flex-col gap-1 rounded-md border border-border bg-card p-3 text-body-sm">
                <p className="font-medium text-foreground">{plural(importer.found, state.result.transactions.length, locale)}</p>
                {state.result.skipped.length > 0 && (
                  <p className="text-muted-foreground">
                    {plural(importer.skipped, state.result.skipped.length, locale)} — {importer.skippedHint}
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {importer.cancel}
            </Button>
            <Button type="button" onClick={confirm} disabled={state.step !== "preview" || state.result.transactions.length === 0}>
              {importer.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {feedback && (
        <p role="status" className="basis-full text-body-sm text-success">
          {feedback}
        </p>
      )}
    </>
  );
}
