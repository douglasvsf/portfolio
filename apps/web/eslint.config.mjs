import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Storybook gerado no build (pnpm design-system:build) — não é código-fonte.
    "public/design-system/**",
    // Relatórios gerados (cobertura de testes, Lighthouse CI).
    "coverage/**",
    ".lighthouseci/**",
  ]),
]);

export default eslintConfig;
