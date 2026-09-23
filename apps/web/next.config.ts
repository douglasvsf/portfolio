import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  // Pacotes do Design System são publicados como código-fonte TypeScript.
  transpilePackages: ["@godzilla/ui", "@godzilla/i18n", "@godzilla/icons", "@godzilla/tokens"],
};

export default nextConfig;
