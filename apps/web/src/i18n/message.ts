/**
 * Interpola variáveis em textos dos dicionários: fmt("{n} ações", { n: 3 }).
 * Os dicionários guardam só strings (serializáveis), então funcionam tanto em
 * Server quanto em Client Components.
 */
export function fmt(template: string, vars: Record<string, string | number>) {
  return template.replace(/\{(\w+)\}/g, (match, key: string) => (key in vars ? String(vars[key]) : match));
}
