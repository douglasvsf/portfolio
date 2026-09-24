import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    supportFile: "cypress/support/e2e.ts",
  },
  // No CI, uma falha isolada (ex.: a brapi demorar a responder) é repetida
  // antes de reprovar o pipeline; localmente o teste falha na hora.
  retries: { runMode: 2, openMode: 0 },
  video: false,
  screenshotOnRunFailure: true,
});
