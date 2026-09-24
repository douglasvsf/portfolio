"use client";

import { useCallback, useSyncExternalStore } from "react";
import { emptyPortfolio, portfolioSchema, transactionFingerprint, type PortfolioData, type Transaction } from "./schema";

/**
 * Persistência da carteira no localStorage do navegador — nada vai para o
 * servidor. Qualquer aba aberta recebe as mudanças (evento "storage").
 */

export const STORAGE_KEY = "kaiju-stocks:portfolio";

const listeners = new Set<() => void>();
let cache: { raw: string | null; data: PortfolioData } | null = null;

function readRaw(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // modo privado / storage bloqueado
  }
}

/** Snapshot estável: só reprocessa quando o texto salvo muda. */
function getSnapshot(): PortfolioData {
  const raw = readRaw();
  if (cache && cache.raw === raw) return cache.data;
  cache = { raw, data: parsePortfolio(raw) };
  return cache.data;
}

export function parsePortfolio(raw: string | null): PortfolioData {
  if (!raw) return emptyPortfolio();
  try {
    const result = portfolioSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : emptyPortfolio();
  } catch {
    return emptyPortfolio();
  }
}

function write(data: PortfolioData) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Sem storage a carteira vive só nesta aba.
    cache = { raw: cache?.raw ?? null, data };
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

/** No servidor não há carteira: a tela mostra o esqueleto até hidratar. */
const getServerSnapshot = () => null;

/** Mescla sem duplicar: a mesma operação importada duas vezes entra uma vez só. */
export function mergeTransactions(current: readonly Transaction[], incoming: readonly Transaction[]) {
  const seen = new Set(current.map(transactionFingerprint));
  const added = incoming.filter((transaction) => {
    const key = transactionFingerprint(transaction);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return { transactions: [...current, ...added], added: added.length, duplicates: incoming.length - added.length };
}

export function usePortfolio() {
  const data = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const update = useCallback((next: (transactions: Transaction[]) => Transaction[]) => {
    const current = getSnapshot();
    write({ ...current, transactions: next(current.transactions) });
  }, []);

  return {
    /** `null` enquanto não hidratou (SSR). */
    transactions: data?.transactions ?? null,
    add: useCallback((transaction: Transaction) => update((list) => [...list, transaction]), [update]),
    remove: useCallback((id: string) => update((list) => list.filter((transaction) => transaction.id !== id)), [update]),
    importMany: useCallback(
      (incoming: Transaction[]) => {
        const result = mergeTransactions(getSnapshot().transactions, incoming);
        update(() => result.transactions);
        return result;
      },
      [update],
    ),
    replaceAll: useCallback((transactions: Transaction[]) => update(() => transactions), [update]),
  };
}

/** Backup em JSON (o mesmo formato salvo no navegador). */
export function exportPortfolio(transactions: readonly Transaction[]) {
  return JSON.stringify({ version: 1, transactions }, null, 2);
}
