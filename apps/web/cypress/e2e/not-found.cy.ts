/**
 * Página 404: status HTTP 404 de verdade (bom para SEO), idioma pelo endereço
 * e o botão que volta para a home no mesmo idioma.
 */
describe("404", () => {
  it("responde 404 para endereço que não existe, com ou sem idioma", () => {
    for (const path of ["/pt-BR/pagina-que-nao-existe", "/pt-BR/projetos/case-inexistente", "/rota-qualquer"]) {
      cy.request({ url: path, failOnStatusCode: false }).its("status").should("eq", 404);
    }
  });

  it("mostra a página no idioma do endereço e volta para a home", () => {
    cy.visit("/en-US/pagina-que-nao-existe", { failOnStatusCode: false });
    cy.contains("h1", "Page not found").should("be.visible");
    cy.contains("/en-US/pagina-que-nao-existe").should("be.visible");
    cy.document().its("documentElement.lang").should("eq", "en-US");

    cy.visit("/pt-BR/pagina-que-nao-existe", { failOnStatusCode: false });
    cy.contains("h1", "Página não encontrada").should("be.visible");
    cy.contains("a", "Voltar para a home").should("have.attr", "href", "/pt-BR").click();
    cy.location("pathname").should("eq", "/pt-BR");
  });
});
