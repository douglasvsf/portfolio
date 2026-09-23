describe("Homepage", () => {
  it("redireciona a raiz para o idioma do navegador", () => {
    cy.visit("/", { headers: { "Accept-Language": "es-ES,es;q=0.9" } });
    cy.location("pathname").should("eq", "/es-ES");
    cy.get("html").should("have.attr", "lang", "es-ES");
  });

  describe("em português", () => {
    beforeEach(() => {
      cy.visit("/pt-BR");
    });

    it("deve carregar corretamente", () => {
      cy.get("h1").should("contain.text", "GODZILLA");
      cy.contains("Full Stack Developer").should("be.visible");
    });

    it("deve navegar para projetos", () => {
      cy.contains("a", "Ver projetos").click();

      cy.location("hash").should("eq", "#projects");
      cy.get("#projects").should("be.visible").within(() => {
        cy.contains("h2", "Projetos").should("be.visible");
      });
    });

    it("deve navegar para contato", () => {
      cy.get("header nav").contains("a", "Contato").click();

      cy.location("hash").should("eq", "#contact");
      cy.get("#contact").should("be.visible").within(() => {
        cy.contains("h2", "Contato").should("be.visible");
      });
    });

    it("troca de idioma pelas bandeiras e lembra a escolha", () => {
      cy.get("header").find('button[aria-label="English"]').click();

      cy.location("pathname").should("eq", "/en-US");
      cy.contains("h2", "Projects").should("exist");
      cy.get("header").find('button[aria-label="English"]').should("have.attr", "aria-pressed", "true");

      cy.visit("/");
      cy.location("pathname").should("eq", "/en-US");
    });
  });
});
