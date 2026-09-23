import react from "@godzilla/eslint-config/react";

export default [
  ...react,
  {
    ignores: ["vitest.config.ts"],
  },
];
