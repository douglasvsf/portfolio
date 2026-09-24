/**
 * Carteira do Kaiju Stocks. A API de cotações é interceptada com dados
 * fixos: o teste não depende da brapi nem do Banco Central.
 */
const QUOTES = {
  quotes: {
    PETR4: { price: 50, change: 1.2, name: "PETROBRAS", logo: null, sector: "Energy Minerals", assetClass: "stock" },
    VALE3: { price: 70, change: -0.5, name: "VALE", logo: null, sector: "Non-Energy Minerals", assetClass: "stock" },
    ITUB4: { price: 42, change: 0.3, name: "ITAU UNIBANCO", logo: null, sector: "Finance", assetClass: "stock" },
    WEGE3: { price: 51, change: 0.1, name: "WEG", logo: null, sector: "Producer Manufacturing", assetClass: "stock" },
    MXRF11: { price: 9, change: -0.1, name: "MXRF11", logo: null, sector: "Miscellaneous", assetClass: "fii" },
    BOVA11: { price: 180, change: -0.6, name: "BOVA11", logo: null, sector: "Miscellaneous", assetClass: "etf" },
    TAEE11: { price: 41, change: 0.2, name: "TAESA", logo: null, sector: "Utilities", assetClass: "stock" },
  },
  missing: [],
  cdi: { from: "2025-01-15", to: "2026-09-23", percent: 25.5, days: 425 },
  updatedAt: "2026-09-24T17:00:00.000Z",
};

/** O Intl separa "R$" do valor com espaço não separável (U+00A0). */
const shouldShow = (row: JQuery<HTMLElement>, ...values: string[]) => {
  const text = row.text().replace(/ /g, " ");
  values.forEach((value) => expect(text).to.include(value));
};

describe("Carteira", () => {
  beforeEach(() => {
    cy.intercept("GET", "/api/stocks/portfolio*", { body: QUOTES }).as("quotes");
    cy.setCookie("NEXT_LOCALE", "pt-BR");
    cy.visit("/stocks/carteira");
  });

  it("começa vazia e carrega a carteira de exemplo", () => {
    cy.contains("h2", "Sua carteira está vazia").should("be.visible");
    cy.contains("button", "Ver carteira de exemplo").click();

    cy.wait("@quotes").its("request.url").should("include", "since=2025-01-15");
    cy.contains("carteira de exemplo").should("be.visible");
    cy.contains("Patrimônio").should("be.visible");
    cy.contains("CDI no período").parent().should("contain.text", "+25,5%");
    cy.get("table").first().within(() => {
      cy.contains("tr", "PETR4").should((row) => shouldShow(row, "R$ 50,00", "R$ 35,43"));
    });
  });

  it("adiciona uma compra pelo formulário, com validação", () => {
    cy.contains("button", "Adicionar operação").click();
    cy.get("[role=dialog]").within(() => {
      cy.contains("button", "Adicionar").click();
      cy.contains("Use o código de negociação").should("be.visible");

      cy.contains("label", "Ativo").click();
      cy.focused().type("taee11");
      cy.contains("label", "Quantidade").click();
      cy.focused().type("20");
      cy.contains("label", "Preço unitário").click();
      cy.focused().type("35,40");
      cy.contains("R$ 708,00").should("be.visible");
      cy.contains("button", "Adicionar").click();
    });

    cy.get("[role=dialog]").should("not.exist");
    cy.contains("tr", "TAEE11").should((row) => shouldShow(row, "R$ 35,40", "R$ 820,00"));
    cy.window().then((win) => {
      const saved = JSON.parse(win.localStorage.getItem("kaiju-stocks:portfolio") ?? "{}");
      expect(saved.transactions).to.have.length(1);
    });
  });

  it("importa a planilha de Movimentação da B3", () => {
    cy.contains("button", "Importar da B3").click();
    cy.get("[role=dialog]").within(() => {
      cy.get("input[type=file]").selectFile("cypress/fixtures/b3-movimentacao.xlsx");
      cy.contains("5 operações encontradas").should("be.visible");
      cy.contains("1 linha ignorada").should("be.visible");
      cy.contains("button", "Importar").click();
    });

    cy.contains("5 operações importadas").should("be.visible");
    cy.contains("tr", "PETR4").should("contain.text", "60");
    cy.contains("tr", "MXRF11").should("contain.text", "300");

    // A mesma planilha de novo não duplica nada.
    cy.contains("button", "Importar da B3").click();
    cy.get("[role=dialog]").within(() => {
      cy.get("input[type=file]").selectFile("cypress/fixtures/b3-movimentacao.xlsx");
      cy.contains("button", "Importar").click();
    });
    cy.contains("[role=status]", /^5 já estavam na carteira$/).should("be.visible");
  });

  it("apaga a carteira com confirmação", () => {
    cy.contains("button", "Ver carteira de exemplo").click();
    cy.contains("button", "Backup").click();
    cy.contains("[role=menuitem]", "Apagar carteira").click();
    cy.contains("button", "Apagar tudo").click();
    cy.contains("h2", "Sua carteira está vazia").should("be.visible");
  });
});
