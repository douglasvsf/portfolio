/**
 * URL pública do site — base das URLs absolutas de SEO (canonical, hreflang,
 * Open Graph). Ordem: variável explícita → domínio de produção da Vercel
 * (variável de sistema) → localhost.
 */
export const SITE_URL = new URL(
  process.env.NEXT_PUBLIC_SITE_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
);
