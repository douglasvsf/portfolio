import * as Sentry from "@sentry/nextjs";
import { reportContractIssuesToSentry } from "@/lib/observability/contract-reporting";
import { sentryOptions } from "@/lib/observability/options";

Sentry.init(sentryOptions);
reportContractIssuesToSentry();
