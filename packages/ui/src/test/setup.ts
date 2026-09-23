import "@testing-library/jest-dom/vitest";
import { expect } from "vitest";
// Import "profundo": o barrel público `vitest-axe/matchers` reexporta com
// `export type *`, o que (incorretamente) marca `toHaveNoViolations` como
// type-only para o TS. `dist/matchers` tem o export de valor correto.
import { toHaveNoViolations } from "vitest-axe/dist/matchers";

/**
 * `vitest-axe@0.1.0` publica `dist/extend-expect.js` vazio (bug conhecido do
 * pacote) — o side-effect import não registra o matcher em runtime, mesmo
 * com os tipos corretos. Registramos manualmente aqui; os tipos vêm de
 * `./vitest-axe.d.ts`.
 */
expect.extend({ toHaveNoViolations });
