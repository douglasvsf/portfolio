import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * Escala tipográfica do Design System (ver @godzilla/tokens → `--text-*`).
 * O tailwind-merge precisa conhecê-la: sem isso ele trata `text-body` como
 * se fosse uma COR e descarta a cor de verdade ao lado (ex.: `text-body` +
 * `text-primary-foreground` → sobrava só o tamanho e o texto ficava ilegível).
 */
export const typographyScale = ["display", "h1", "h2", "h3", "h4", "body-lg", "body", "body-sm", "caption", "label", "overline"] as const;

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: [...typographyScale] }],
    },
  },
});

/**
 * Combina classNames condicionais (clsx) e resolve conflitos de utilities
 * Tailwind (tailwind-merge) — ex.: `cn("px-2", condition && "px-4")` sempre
 * resulta em só uma classe de padding-x, a última que "ganha".
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
