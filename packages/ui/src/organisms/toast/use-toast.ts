"use client";

import { useEffect, useState, type ReactNode } from "react";
import type { ToastProps } from "./toast";

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY_MS = 5000;

export interface ToastItem {
  id: string;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  variant?: ToastProps["variant"];
}

type Listener = (toasts: ToastItem[]) => void;

let memoryState: ToastItem[] = [];
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener(memoryState));
}

function genId() {
  return Math.random().toString(36).slice(2, 10);
}

export type ToastOptions = Omit<ToastItem, "id">;

/**
 * Dispara um toast a partir de qualquer lugar (fora de componentes React
 * inclusive — ex.: dentro de um handler de erro de API). `<Toaster />`
 * (colocado uma vez perto da raiz da aplicação) é quem efetivamente renderiza.
 */
export function toast(options: ToastOptions): { id: string; dismiss: () => void } {
  const id = genId();
  memoryState = [{ id, ...options }, ...memoryState].slice(0, TOAST_LIMIT);
  emit();

  const dismiss = () => {
    memoryState = memoryState.filter((t) => t.id !== id);
    emit();
  };

  setTimeout(dismiss, TOAST_REMOVE_DELAY_MS);

  return { id, dismiss };
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastItem[]>(memoryState);

  useEffect(() => {
    listeners.add(setToasts);
    return () => {
      listeners.delete(setToasts);
    };
  }, []);

  return {
    toasts,
    toast,
    dismiss: (id: string) => {
      memoryState = memoryState.filter((t) => t.id !== id);
      emit();
    },
  };
}
