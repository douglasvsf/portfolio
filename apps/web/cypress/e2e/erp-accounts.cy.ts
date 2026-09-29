/**
 * Contas do GODZILLA ERP (acesso por convite), de ponta a ponta contra a API
 * com Mongo em memória: instalar o dono → convidar → aceitar o convite →
 * bloquear → a pessoa bloqueada não entra mais.
 *
 * A instalação só acontece uma vez por banco; numa nova tentativa (retry do
 * CI) o teste entra com a conta do dono que já existe.
 */
const SETUP_TOKEN = "e2e-setup-token-0123456789";
const OWNER = { email: "dono@exemplo.com.br", password: "senha-forte-do-dono" };

const asVisitor = () => {
  const ip = `198.51.100.${Math.floor(Math.random() * 250) + 1}`;
  cy.intercept({ method: "POST", url: "/erp**" }, (request) => {
    request.headers["x-forwarded-for"] = ip;
  });
};

const fillPassword = (password: string) => {
  cy.get("input[name='password']").type(password, { log: false });
  cy.get("input[name='confirm']").type(password, { log: false });
};

const logout = () => {
  cy.contains("button", "Sair").click();
  cy.location("pathname").should("eq", "/erp");
};

const login = (email: string, password: string) => {
  cy.visit("/erp");
  cy.get("input[name='email']").type(email);
  cy.get("input[name='password']").type(password, { log: false });
  cy.contains("button", /^Entrar$/).click();
};

describe("GODZILLA ERP — contas por convite", () => {
  it("dono instala, convida, a pessoa entra e depois é bloqueada", () => {
    asVisitor();
    cy.visit("/erp");
    cy.get("body").then(($body) => {
      if ($body.text().includes("Instalar o sistema")) {
        cy.contains("a", "Instalar o sistema").click();
        cy.get("input[name='token']").type(SETUP_TOKEN, { log: false });
        cy.get("input[name='companyName']").type("Mercado do Dono");
        cy.get("input[name='name']").type("Dono do Sistema");
        cy.get("input[name='email']").type(OWNER.email);
        fillPassword(OWNER.password);
        cy.contains("button", "Criar minha conta de dono").click();
      } else {
        login(OWNER.email, OWNER.password);
        cy.visit("/erp/admin");
      }
    });

    cy.location("pathname", { timeout: 20_000 }).should("eq", "/erp/admin");
    cy.contains("h1", "Painel do dono").should("be.visible");
    cy.get("nav[aria-label='Menu do ERP']").should("contain.text", "Equipe").and("contain.text", "Painel");

    // Convite para a própria empresa, pela Equipe.
    const email = `vendedora.${Date.now()}@exemplo.com.br`;
    cy.visit("/erp/equipe");
    cy.get("input[name='email']").type(email);
    cy.contains("button", "Gerar convite").click();
    cy.get("input[aria-label='Link gerado']", { timeout: 20_000 })
      .invoke("val")
      .then((link) => {
        expect(String(link)).to.match(/\/erp\/convite\/[A-Za-z0-9_-]{43}$/);
        logout();

        cy.visit(new URL(String(link)).pathname);
        cy.contains("Você foi convidado").should("be.visible");
        cy.contains("Vendedor").should("be.visible");
        cy.get("input[name='name']").type("Vendedora Teste");
        fillPassword("senha-da-vendedora");
        cy.contains("button", "Criar conta e entrar").click();
        cy.location("pathname", { timeout: 20_000 }).should("eq", "/erp/dashboard");
        cy.contains("a", "Vendedora").should("be.visible");
        cy.get("nav[aria-label='Menu do ERP']").should("not.contain.text", "Equipe");

        // O link é de uso único.
        logout();
        cy.visit(new URL(String(link)).pathname);
        cy.contains("Convite inválido").should("be.visible");
      });

    // Dono bloqueia; a vendedora não entra mais.
    login(OWNER.email, OWNER.password);
    cy.location("pathname", { timeout: 20_000 }).should("eq", "/erp/dashboard");
    cy.visit("/erp/equipe");
    cy.contains("tr", email).contains("button", "Bloquear").click();
    cy.contains("tr", email).should("contain.text", "Bloqueado");
    logout();

    login(email, "senha-da-vendedora");
    cy.contains("bloqueado").should("be.visible");
    cy.location("pathname").should("eq", "/erp");
  });

  it("login errado mostra mensagem genérica", () => {
    asVisitor();
    login("ninguem@exemplo.com.br", "senha-qualquer-123");
    cy.contains("E-mail ou senha inválidos").should("be.visible");
  });
});
