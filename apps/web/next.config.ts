import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  agentRules: false,
  // Pacotes do Design System são publicados como código-fonte TypeScript.
  transpilePackages: ["@godzilla/ui", "@godzilla/i18n", "@godzilla/icons", "@godzilla/tokens"],
  // O Storybook do Design System é gerado em public/design-system (ver
  // "build" no package.json). Ele usa caminhos relativos, então a URL precisa
  // apontar para dentro da pasta — /design-system sozinho quebraria os assets.
  images: {
    // Logos das empresas no /stocks, servidos pela brapi (SVG).
    dangerouslyAllowSVG: true,
    remotePatterns: [
      { protocol: "https", hostname: "icons.brapi.dev" },
      // Capas e fotos de artistas no /spotify (CDN da Spotify).
      { protocol: "https", hostname: "i.scdn.co" },
      { protocol: "https", hostname: "*.spotifycdn.com" },
      // Capas do Last.fm.
      { protocol: "https", hostname: "lastfm.freetls.fastly.net" },
      { protocol: "https", hostname: "lastfm-img.freetls.fastly.net" },
    ],
  },
  async redirects() {
    return [{ source: "/design-system", destination: "/design-system/index.html", permanent: false }];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG ?? "portfolio-id",
  project: process.env.SENTRY_PROJECT ?? "javascript-nextjs",
  // Source maps só sobem com SENTRY_AUTH_TOKEN (configurado na Vercel); sem ele o build segue normal.
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sourcemaps: { deleteSourcemapsAfterUpload: true },
  // Eventos passam pelo próprio domínio: bloqueadores de anúncio barram *.sentry.io.
  // Fica sob /api porque o proxy de i18n ignora essa rota.
  tunnelRoute: "/api/monitoring",
  silent: !process.env.CI,
  telemetry: false,
});
