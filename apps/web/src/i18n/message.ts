/**
 * Interpola variáveis em textos dos dicionários: fmt("{n} ações", { n: 3 }).
 * Os dicionários guardam só strings (serializáveis), então funcionam tanto em
 * Server quanto em Client Components.
 */
export function fmt(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}

/** Escolhe a forma singular/plural do idioma e interpola {n}. */
export function plural(forms: { one: string; other: string }, n: number, locale: string) {
  const form = new Intl.PluralRules(locale).select(n) === "one" ? forms.one : forms.other;
  return fmt(form, { n: n.toLocaleString(locale) });
}
