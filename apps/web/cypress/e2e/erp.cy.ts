/**
 * GODZILLA ERP ponta a ponta: site (BFF) → API NestJS → Mongo, sem mocks.
 * No CI a API roda com Mongo em memória (apps/api/scripts/e2e-server.ts).
 *
 * Cada teste finge ser um visitante diferente (x-forwarded-for próprio), para
 * o limite de "criar demo" da API valer por pessoa, como em produção.
 */
const enterDemo = () => {
  const ip = `203.0.113.${Math.floor(Math.random() * 250) + 1}`;
  cy.intercept({ method: "POST", url: "/erp**" }, (request) => {
    request.headers["x-forwarded-for"] = ip;
  });
  cy.visit("/erp");
  cy.contains("button", "Entrar na demonstração").click();
  cy.location("pathname", { timeout: 20_000 }).should("eq", "/erp/dashboard");
};

describe("GODZILLA ERP", () => {
  it("cria a empresa demo com dados do mercado", () => {
    enterDemo();
    cy.contains("h1", "Dashboard").should("be.visible");
    cy.contains("Mercado Godzilla #").should("be.visible");
    cy.visit("/erp/produtos");
    cy.get("table tbody tr").should("have.length.greaterThan", 5);
  });

  it("pedido: rascunho → confirmar baixa o estoque no livro-razão", () => {
    enterDemo();
    cy.visit("/erp/pedidos/novo");

    cy.get("select[aria-label='Produto a adicionar'] option")
      .first()
      .invoke("text")
      .then((label) => {
        const product = label.split(" — ")[0]!;
        cy.contains("button", "Adicionar").click();
        cy.get(`input[aria-label^='Quantidade de ${product}']`).clear().type("2");
        cy.contains("button", "Criar pedido (rascunho)").click();

        cy.location("pathname", { timeout: 20_000 }).should("match", /^\/erp\/pedidos\/[a-f0-9]{24}$/);
        cy.contains("button", "Confirmar pedido").click();
        cy.contains("Pedido confirmado — estoque baixado.", { timeout: 20_000 }).should("be.visible");

        cy.visit("/erp/estoque");
        cy.get("table tbody tr")
          .first()
          .should("contain.text", product)
          .and("contain.text", "Venda — pedido #49");
      });
  });

  it("PDV: bipa, lê etiqueta da balança, paga em dinheiro, dá troco e gera o cupom", () => {
    enterDemo();
    cy.visit("/erp/pdv");
    cy.get("#pos-code").should("have.attr", "placeholder").and("include", "Enter adiciona");

    cy.get("[aria-labelledby='test-codes'] button").as("codes");
    cy.get("@codes").eq(0).click();
    cy.get("@codes").eq(0).click();
    cy.get("@codes").eq(4).click();
    cy.get("table tbody tr").should("have.length", 2);
    cy.get("table tbody tr").first().find("input").should("have.value", "2");
    cy.get("table tbody tr").eq(1).find("input").should("have.value", "1,25");

    cy.contains("button", "Dinheiro").click();
    cy.get("input[aria-label='Valor em Dinheiro']").type("100000{enter}");
    cy.get("[data-testid='pos-balance']").parent().should("contain.text", "Troco");
    cy.contains("button", "Finalizar venda").click();

    cy.contains("Venda #49 concluída", { timeout: 20_000 }).should("be.visible");
    cy.contains("Troco:").should("be.visible");
    cy.contains("a", "Imprimir cupom")
      .invoke("attr", "href")
      .then((href) => {
        cy.visit(href!);
        cy.contains("CUPOM NÃO FISCAL").should("be.visible");
        cy.contains("Cliente: Consumidor final").should("exist");
        cy.contains("Dinheiro").should("exist");
      });

    cy.visit("/erp/pedidos");
    cy.get("table tbody tr").first().should("contain.text", "#49").and("contain.text", "PDV").and("contain.text", "Consumidor final");
  });

  it("vendedor não vê ações nem dados restritos ao administrador", () => {
    enterDemo();
    cy.contains("button", "Vendedor").click();
    cy.contains("button[aria-pressed='true']", "Vendedor").should("exist");

    cy.visit("/erp/produtos");
    cy.get("table").should("be.visible");
    cy.contains("button", "Novo produto").should("not.exist");
    cy.contains("th", "Custo").should("not.exist");

    cy.visit("/erp/estoque");
    cy.get("table").should("be.visible");
    cy.contains("button", "Nova movimentação").should("not.exist");
  });

  it("sair apaga a sessão e volta para a entrada", () => {
    enterDemo();
    cy.contains("button", "Sair").click();
    cy.location("pathname").should("eq", "/erp");
    cy.getCookie("erp_session").should("be.null");
    cy.visit("/erp/dashboard");
    cy.location("pathname").should("eq", "/erp");
  });
});
