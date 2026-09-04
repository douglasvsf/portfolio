describe("Homepage", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("deve carregar corretamente", () => {
    cy.get("h1").should("contain.text", "GODZILLA");
    cy.contains("Full Stack Developer").should("be.visible");
  });

  it("deve navegar para projetos", () => {
    cy.contains("a", "Ver projetos").click();

    cy.location("hash").should("eq", "#projetos");
    cy.get("#projetos").should("be.visible").within(() => {
      cy.contains("h2", "Projetos").should("be.visible");
    });
  });

  it("deve navegar para contato", () => {
    cy.get("header").contains("a", "Contato").click();

    cy.location("hash").should("eq", "#contato");
    cy.get("#contato").should("be.visible").within(() => {
      cy.contains("h2", "Contato").should("be.visible");
    });
  });
});
