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
const PANEL = { email: "painel@exemplo.com.br", password: "senha-so-do-painel-e2e" };

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
        cy.location("pathname", { timeout: 20_000 }).should("eq", "/erp/dashboard");
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

  it("pedido de acesso chega ao painel e a aprovação gera o convite", () => {
    asVisitor();
    const email = `pedido.${Date.now()}@exemplo.com.br`;
    cy.visit("/erp");
    cy.contains("a", "Solicitar acesso").click();
    cy.get("input[name='name']").type("Carlos Pereira");
    cy.get("input[name='email']").type(email);
    cy.get("input[name='company']").type("Empório do Carlos");
    cy.get("textarea[name='message']").type("Quero testar no meu mercado");
    cy.contains("button", "Enviar pedido").click();
    cy.contains("Pedido enviado!").should("be.visible");

    login(OWNER.email, OWNER.password);
    cy.location("pathname", { timeout: 20_000 }).should("eq", "/erp/dashboard");
    cy.visit("/erp/admin");
    cy.contains("li", email).within(() => {
      cy.contains("Quero testar no meu mercado").should("exist");
      cy.get("input[name='companyName']").should("have.value", "Empório do Carlos");
      cy.contains("button", "Aprovar e gerar convite").click();
      cy.get("input[aria-label='Link gerado']", { timeout: 20_000 })
        .invoke("val")
        .should("match", /\/erp\/convite\/[A-Za-z0-9_-]{43}$/);
    });
  });

  it("mensagem do formulário de contato chega ao painel do dono", () => {
    const email = `contato.${Date.now()}@exemplo.com.br`;
    const message = "Tenho um projeto de e-commerce e queria conversar sobre prazo e orçamento.";
    cy.visit("/pt-BR");
    cy.get("[data-testid='contact-form']").scrollIntoView();
    cy.get("[data-testid='contact-form']").within(() => {
      cy.contains("button", "Enviar mensagem").click();
      cy.contains("Informe seu nome.").should("be.visible");
      cy.contains("Escreva pelo menos 20 caracteres.").should("be.visible");

      // Um erro não apaga o que a pessoa já digitou.
      cy.get("input[name='name']").type("Marina Costa");
      cy.contains("button", "Enviar mensagem").click();
      cy.contains("Informe seu nome.").should("not.exist");
      cy.get("input[name='name']").should("have.value", "Marina Costa");

      cy.contains("label", "Freelance").click();
      cy.get("textarea[name='message']").should("have.attr", "placeholder").and("contain", "orçamento");
      cy.get("input[name='email']").type(email);
      cy.get("input[name='company']").type("Loja da Marina");
      cy.get("textarea[name='message']").type(message, { delay: 0 });
      cy.contains("button", "Enviar mensagem").click();
    });
    cy.get("[data-testid='contact-success']", { timeout: 20_000 }).should("contain", "Mensagem enviada!");

    // As mensagens ficam no painel do site (/admin), que tem login próprio — não é a conta do ERP.
    cy.visit("/admin");
    cy.contains("h1", "Painel do site").should("be.visible");
    cy.contains(email).should("not.exist");
    cy.get("body").then(($body) => {
      // Cadastro único do login do painel: só aparece enquanto não existe nenhum.
      if ($body.find("[data-testid='admin-setup']").length === 0) return;
      cy.get("input[name='ownerEmail']").type(OWNER.email);
      cy.get("input[name='ownerPassword']").type("senha-errada-12345", { log: false });
      cy.get("input[name='email']").type(PANEL.email);
      fillPassword(PANEL.password);
      cy.contains("button", "Criar login do painel").click();
      cy.contains("A conta de dono informada não confere.").should("be.visible");
      cy.get("input[name='ownerEmail']").should("have.value", OWNER.email);
      cy.get("input[name='ownerPassword']").type(OWNER.password, { log: false });
      fillPassword(PANEL.password);
      cy.contains("button", "Criar login do painel").click();
      cy.contains("h2", "Mensagens de contato", { timeout: 20_000 }).should("be.visible");
      cy.contains("button", "Sair").click();
    });

    // Depois de criado, o cadastro some e só o login novo entra: a conta de dono do ERP não vale aqui.
    cy.get("input[name='password']").should("be.visible");
    cy.get("[data-testid='admin-setup']").should("not.exist");
    cy.get("input[name='email']").type(OWNER.email);
    cy.get("input[name='password']").type(OWNER.password, { log: false });
    cy.contains("button", /^Entrar$/).click();
    cy.contains("E-mail ou senha inválidos.").should("be.visible");
    cy.get("input[name='email']").clear().type(PANEL.email);
    cy.get("input[name='password']").clear().type(PANEL.password, { log: false });
    cy.contains("button", /^Entrar$/).click();
    cy.contains("h2", "Mensagens de contato", { timeout: 20_000 }).should("be.visible");
    cy.getCookie("admin_session").should("have.property", "httpOnly", true);
    cy.getCookie("erp_session").should("not.exist");

    cy.contains("li", email).within(() => {
      cy.contains("Marina Costa").should("exist");
      cy.contains("Freelance").should("exist");
      cy.contains(message).should("exist");
      cy.contains("a", "Responder").should("have.attr", "href").and("contain", `mailto:${email}`);
      cy.contains("button", "Marcar como lida").click();
      cy.contains("button", "Marcar como não lida", { timeout: 20_000 }).should("exist");
      cy.contains("button", "Apagar").click();
      cy.contains("button", "Apagar mesmo").click();
    });
    cy.contains("li", email, { timeout: 20_000 }).should("not.exist");

    cy.contains("button", "Sair").click();
    cy.get("input[name='password']").should("be.visible");
    cy.getCookie("admin_session").should("not.exist");
  });

  it("login errado mostra mensagem genérica", () => {
    asVisitor();
    login("ninguem@exemplo.com.br", "senha-qualquer-123");
    cy.contains("E-mail ou senha inválidos").should("be.visible");
  });
});
