export interface Dictionary {
  loading: string;
  next: string;
  previous: string;
  search: string;
  cancel: string;
  confirm: string;
  close: string;
  noResults: string;
  select: string;
  clear: string;
  required: string;
  optional: string;
  error: string;
  retry: string;
  /** Rótulo do seletor de idioma (ex.: aria-label do LocaleSwitcher). */
  language: string;
}

export const locales = ["pt-BR", "en-US", "es-ES"] as const;

export type Locale = (typeof locales)[number];

export interface LocaleMeta {
  /** Nome do idioma na própria língua — é assim que o usuário o reconhece. */
  label: string;
  /** Sigla curta para espaços apertados (ex.: "PT"). */
  shortLabel: string;
}

export const localeMeta: Record<Locale, LocaleMeta> = {
  "pt-BR": { label: "Português", shortLabel: "PT" },
  "en-US": { label: "English", shortLabel: "EN" },
  "es-ES": { label: "Español", shortLabel: "ES" },
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
