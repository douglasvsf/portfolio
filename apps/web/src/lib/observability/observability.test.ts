import * as Sentry from "@sentry/nextjs";
import { contractReporter } from "@/lib/http/contract";
import { reportContractIssuesToSentry } from "./contract-reporting";
import { sentryOptions } from "./options";

jest.mock("@sentry/nextjs", () => ({ captureMessage: jest.fn() }));

describe("observabilidade", () => {
  const original = contractReporter.report;
  afterEach(() => {
    contractReporter.report = original;
  });

  it("quebra de contrato continua no log e vira evento agrupado por fonte", () => {
    const warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    reportContractIssuesToSentry();
    contractReporter.report({ source: "brapi /quote/list", message: "stocks.0.stock: obrigatório", dropped: 1 });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining("[contract] brapi /quote/list"));
    expect(Sentry.captureMessage).toHaveBeenCalledWith(
      "Contrato quebrado: brapi /quote/list",
      expect.objectContaining({
        level: "warning",
        fingerprint: ["contract", "brapi /quote/list"],
        tags: { contract_source: "brapi /quote/list", contract_partial: "true" },
      }),
    );
    warn.mockRestore();
  });

  it("Sentry fica desligado fora de produção (dev local e testes)", () => {
    expect(sentryOptions.enabled).toBe(false);
  });
});
