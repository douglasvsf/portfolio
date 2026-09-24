"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { ChevronDown, Download, Trash2, Upload } from "@godzilla/icons";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  useLocale,
} from "@godzilla/ui";
import { useStocksDictionary } from "@/content/stocks";
import { plural } from "@/i18n/message";
import { exportPortfolio, parsePortfolio } from "@/lib/portfolio/store";
import type { Transaction } from "@/lib/portfolio/schema";

interface BackupMenuProps {
  transactions: readonly Transaction[];
  onRestore: (transactions: Transaction[]) => { added: number };
  onClear: () => void;
}

/** Exportar/restaurar em JSON e apagar tudo (com confirmação). */
export function BackupMenu({ transactions, onRestore, onClear }: BackupMenuProps) {
  const { actions, restore } = useStocksDictionary().portfolio;
  const locale = useLocale();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirming, setConfirming] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  function download() {
    const blob = new Blob([exportPortfolio(transactions)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = Object.assign(document.createElement("a"), { href: url, download: `kaiju-carteira-${new Date().toISOString().slice(0, 10)}.json` });
    link.click();
    URL.revokeObjectURL(url);
  }

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const parsed = parsePortfolio(await file.text());
    if (parsed.transactions.length === 0) {
      setFeedback({ tone: "error", text: restore.invalid });
      return;
    }
    const { added } = onRestore(parsed.transactions);
    setFeedback({ tone: "success", text: plural(restore.done, added, locale) });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">
            {actions.backup}
            <ChevronDown aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={download} disabled={transactions.length === 0}>
            <Download className="size-(--size-icon-sm)" aria-hidden="true" />
            {actions.export}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => fileRef.current?.click()}>
            <Upload className="size-(--size-icon-sm)" aria-hidden="true" />
            {actions.restore}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setConfirming(true)} disabled={transactions.length === 0} className="text-destructive">
            <Trash2 className="size-(--size-icon-sm)" aria-hidden="true" />
            {actions.clear}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <input ref={fileRef} type="file" accept="application/json,.json" onChange={upload} className="sr-only" tabIndex={-1} aria-hidden="true" />

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actions.clearTitle}</DialogTitle>
            <DialogDescription>{actions.clearDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              {actions.cancel}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onClear();
                setConfirming(false);
              }}
            >
              {actions.confirmClear}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {feedback && (
        <p role="status" className={feedback.tone === "success" ? "basis-full text-body-sm text-success" : "basis-full text-body-sm text-destructive"}>
          {feedback.text}
        </p>
      )}
    </>
  );
}
