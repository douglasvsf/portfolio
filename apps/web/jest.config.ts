import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

const config: Config = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/jest.setup.ts"],
  testPathIgnorePatterns: ["<rootDir>/cypress/", "<rootDir>/.next/", "<rootDir>/node_modules/"],

  // Cobertura da camada de lógica (integrações, transformações, i18n). A UI é
  // coberta pelos testes E2E (Cypress) e pelos testes do Design System.
  collectCoverageFrom: ["src/lib/**/*.ts", "src/i18n/**/*.ts", "src/content/**/*.ts", "!src/**/*.test.ts"],
  coverageReporters: ["text-summary", "json-summary", "lcov"],
  // O CI falha se a cobertura cair abaixo disso.
  coverageThreshold: {
    global: { statements: 80, branches: 75, functions: 75, lines: 80 },
  },
};

export default createJestConfig(config);
