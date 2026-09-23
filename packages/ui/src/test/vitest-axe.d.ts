import type { AxeMatchers } from "vitest-axe/matchers";

/**
 * `vitest-axe` (0.1.0) declara seus matchers sob `namespace Vi`, convenção
 * antiga que não corresponde mais à estrutura de tipos do Vitest 2.x (que
 * usa `declare module "vitest"`). Reaplicamos a extensão aqui no formato
 * correto para que `toHaveNoViolations()` seja reconhecido pelo TypeScript.
 */
/* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars --
   declaration merging exige interfaces (mesmo "vazias") estendendo AxeMatchers */
declare module "vitest" {
  interface Assertion<T = unknown> extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
