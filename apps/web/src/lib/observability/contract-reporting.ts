import * as Sentry from "@sentry/nextjs";
import { contractReporter } from "@/lib/http/contract";

/**
 * Quebras de contrato das APIs externas viram eventos agrupados por fonte
 * ("lastfm user.gettopartists", "brapi /quote/list"…) — sem deixar de ir
 * para o log.
 */
export function reportContractIssuesToSentry() {
  const log = contractReporter.report.bind(contractReporter);
  contractReporter.report = (issue) => {
    log(issue);
    Sentry.captureMessage(`Contrato quebrado: ${issue.source}`, {
      level: "warning",
      fingerprint: ["contract", issue.source],
      tags: { contract_source: issue.source, contract_partial: String(Boolean(issue.dropped)) },
      extra: { message: issue.message, dropped: issue.dropped },
    });
  };
}
