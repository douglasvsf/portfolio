/**
 * Espelho em TypeScript dos tokens definidos em `theme.css`, para uso em
 * lógica JS que não pode depender de CSS var (media queries via matchMedia,
 * cálculos de layout, testes). Mantido manualmente em sincronia com
 * `theme.css` — os dois arquivos juntos são a fonte da verdade do sistema.
 */

export const breakpoints = {
  sm: "40rem",
  md: "48rem",
  lg: "64rem",
  xl: "80rem",
  "2xl": "96rem",
} as const;

export type Breakpoint = keyof typeof breakpoints;

export const breakpointsPx: Record<Breakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
};

export const zIndex = {
  dropdown: 1000,
  sticky: 1100,
  overlay: 1200,
  modal: 1300,
  popover: 1400,
  toast: 1500,
  tooltip: 1600,
} as const;

export const duration = {
  fast: 100,
  base: 200,
  slow: 350,
} as const;

export const easing = {
  standard: "cubic-bezier(0.4, 0, 0.2, 1)",
  emphasized: "cubic-bezier(0.2, 0, 0, 1)",
} as const;

export const radius = {
  sm: "calc(0.5rem - 4px)",
  md: "calc(0.5rem - 2px)",
  lg: "0.5rem",
  xl: "calc(0.5rem + 4px)",
} as const;

export const typographyScale = [
  "display",
  "h1",
  "h2",
  "h3",
  "h4",
  "body-lg",
  "body",
  "body-sm",
  "caption",
  "label",
  "overline",
] as const;

export type TypographyVariant = (typeof typographyScale)[number];

export const controlSize = {
  sm: "2rem",
  md: "2.5rem",
  lg: "2.75rem",
} as const;

export const iconSize = {
  sm: "1rem",
  md: "1.25rem",
  lg: "1.5rem",
} as const;
