import * as Sentry from "@sentry/nextjs";
import { sentryOptions } from "@/lib/observability/options";

// Sem Session Replay de propósito: pesa no bundle e derruba o score do Lighthouse.
Sentry.init(sentryOptions);

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
