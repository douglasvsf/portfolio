describe("Homepage", () => {
  it("redireciona a raiz para o idioma do navegador", () => {
    cy.visit("/", { headers: { "Accept-Language": "es-ES,es;q=0.9" } });
    cy.location("pathname").should("eq", "/es-ES");
    cy.get("html").should("have.attr", "lang", "es-ES");
  });

  describe("em português", () => {
    beforeEach(() => {
      // O menu do header só aparece a partir de lg (1024px).
      cy.viewport(1280, 800);
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

    it("mostra a engenharia do site com links para o código", () => {
      cy.get("header nav").contains("a", "Engenharia").click();

      cy.location("hash").should("eq", "#engineering");
      cy.get("#engineering").within(() => {
        cy.contains("h2", "Por trás deste site").should("be.visible");
        cy.get("h3").should("have.length", 9);
        cy.contains("a", "Ver no código")
          .should("have.attr", "href")
          .and("match", /^https:\/\/github\.com\/douglasvsf\/portfolio\//);
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

  describe("no mobile", () => {
    it("navega pelo menu hambúrguer", () => {
      cy.viewport("iphone-x");
      cy.visit("/pt-BR");
      cy.get("header nav").should("not.be.visible");

      cy.get("button[aria-label=\"Abrir menu\"]").click();
      cy.get("[role=dialog]").should("be.visible").within(() => {
        cy.contains("a", "Produtos").click();
      });

      cy.get("[role=dialog]").should("not.exist");
      cy.location("hash").should("eq", "#products");
      cy.get("#products").should("be.visible");
    });
  });
});
