import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classNames condicionais (clsx) e resolve conflitos de utilities
 * Tailwind (tailwind-merge) — ex.: `cn("px-2", condition && "px-4")` sempre
 * resulta em só uma classe de padding-x, a última que "ganha".
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
