import type * as Sentry from "@sentry/nextjs";

/**
 * Opções comuns do Sentry (browser, Node e Edge).
 *
 * Só liga em produção e com DSN configurada: dev local e CI não enviam nada.
 * A DSN não é segredo (vai para o navegador de qualquer jeito); o
 * SENTRY_AUTH_TOKEN, usado só no build para subir source maps, é.
 */
export const sentryOptions = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN) && process.env.NODE_ENV === "production",
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  // Plano gratuito: amostra 10% das requisições para performance.
  tracesSampleRate: 0.1,
} satisfies Sentry.BrowserOptions;
