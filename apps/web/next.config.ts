import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/** Hosts de imagem externos (os mesmos de images.remotePatterns): capas, fotos e logos. */
const IMAGE_HOSTS = [
  "https://icons.brapi.dev",
  "https://i.scdn.co",
  "https://*.spotifycdn.com",
  "https://lastfm.freetls.fastly.net",
  "https://lastfm-img.freetls.fastly.net",
  "https://coin-images.coingecko.com",
];

/**
 * Content Security Policy: o navegador só executa script e só conversa com o
 * próprio site (APIs externas são chamadas pelo servidor; o Sentry passa pelo
 * túnel /api/monitoring). Sem iframe (nem dentro nem fora), sem plugin, sem
 * formulário para outro domínio. 'unsafe-inline' em script é exigência dos
 * scripts de inicialização do Next em páginas estáticas; 'unsafe-eval' só em dev.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${IMAGE_HOSTS.join(" ")}`,
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "worker-src 'self' blob:",
  "frame-src 'none'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Sem upgrade-insecure-requests: o HSTS já força HTTPS, todo recurso externo já é
  // HTTPS, e a diretiva quebrava o build servido em http://localhost (E2E e Lighthouse).
].join("; ");

const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
];

const nextConfig: NextConfig = {
  agentRules: false,
  poweredByHeader: false,
  // Pacotes do Design System são publicados como código-fonte TypeScript.
  transpilePackages: ["@godzilla/ui", "@godzilla/i18n", "@godzilla/icons", "@godzilla/tokens"],
  // O Storybook do Design System é gerado em public/design-system (ver
  // "build" no package.json). Ele usa caminhos relativos, então a URL precisa
  // apontar para dentro da pasta — /design-system sozinho quebraria os assets.
  images: {
    // Logos das empresas no /stocks, servidos pela brapi (SVG). SVG pode carregar
    // script: a imagem otimizada vai com CSP própria (sem script, em sandbox).
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    remotePatterns: [
      { protocol: "https", hostname: "icons.brapi.dev" },
      // Capas e fotos de artistas no /spotify (CDN da Spotify).
      { protocol: "https", hostname: "i.scdn.co" },
      { protocol: "https", hostname: "*.spotifycdn.com" },
      // Capas do Last.fm.
      { protocol: "https", hostname: "lastfm.freetls.fastly.net" },
      { protocol: "https", hostname: "lastfm-img.freetls.fastly.net" },
      // Ícones de cripto na carteira do /stocks (CoinGecko).
      { protocol: "https", hostname: "coin-images.coingecko.com" },
    ],
  },
  experimental: {
    // 404 única para endereços inexistentes (o site tem vários layouts raiz): app/global-not-found.tsx.
    globalNotFound: true,
  },
  async headers() {
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      // O Storybook estático (/design-system) tem regras próprias de script; a CSP vale para o resto.
      // O currículo em PDF também fica de fora: a CSP de página (sem plugins) pode impedir o leitor de PDF do navegador.
      { source: "/((?!design-system/)(?!.*\\.pdf$).*)", headers: [{ key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY }] },
    ];
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
