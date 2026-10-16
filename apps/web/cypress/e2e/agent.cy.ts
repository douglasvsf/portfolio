/**
 * Kaiju Agent de ponta a ponta: site (BFF) → API NestJS → ERP (Mongo) e Pay
 * (Postgres). No E2E o "cérebro" é um conjunto de regras (AI_PROVIDER=rules),
 * mas as ferramentas, a confirmação e os limites são os de verdade.
 */
describe("Kaiju Agent", () => {
  it("consulta, pede confirmação antes de cobrar, respeita a recusa e mostra a linha do tempo", () => {
    cy.visit("/agente");
    cy.contains("h1", "Kaiju").should("be.visible");
    cy.contains("button", "Começar conversa").click();
    cy.get("[data-testid='agent-session']", { timeout: 30_000 }).should("contain", "Mercado Godzilla #").and("contain", "Loja Kaiju");
    cy.getCookie("agent_session").should("have.property", "httpOnly", true);

    // Consulta: roda direto, sem confirmação.
    cy.contains("button", "Quais produtos estão com estoque baixo?").click();
    cy.contains("button", "Enviar").click();
    cy.get("[data-role='assistant']", { timeout: 30_000 }).last().should("contain", "produtos com estoque baixo");
    cy.get("[data-testid='agent-timeline']").within(() => {
      cy.contains("Buscar produtos com estoque baixo").should("be.visible");
      cy.contains("executada").should("be.visible");
      cy.contains("summary", "ver dados").click();
      cy.contains("estoqueBaixo").should("be.visible");
    });

    // Ação que muda dados: o agente para e espera.
    cy.get("#agent-message").type("Cria uma cobrança de R$ 49,90 para o Pedido 1042.");
    cy.contains("button", "Enviar").click();
    cy.get("[data-testid='agent-confirm']", { timeout: 30_000 })
      .should("contain", "Criar cobrança Pix de")
      .and("contain", "49,90");
    cy.get("#agent-message").should("be.disabled");
    cy.contains("button", "Recusar").click();
    cy.get("[data-role='assistant']", { timeout: 30_000 }).last().should("contain", "recusou");
    cy.contains("recusada").should("be.visible");

    // De novo, agora confirmando: a cobrança é criada de verdade no Pay.
    cy.get("#agent-message").type("Cria uma cobrança de R$ 49,90 para o Pedido 1042.");
    cy.contains("button", "Enviar").click();
    cy.get("[data-testid='agent-confirm']", { timeout: 30_000 }).within(() => cy.contains("button", "Confirmar").click());
    cy.get("[data-role='assistant']", { timeout: 30_000 }).last().should("contain", "Cobrança criada").and("contain", "49,90");
    cy.get("[data-testid='agent-confirm']").should("not.exist");

    cy.get("#agent-message").type("Qual é o saldo da loja?{enter}");
    cy.get("[data-role='assistant']", { timeout: 30_000 }).last().should("contain", "Saldo disponível");
    cy.get("[data-testid='agent-session']").should("contain", "26 mensagens restantes");

    // No celular, com a linha do tempo aberta, a página não pode ficar mais larga que a tela.
    cy.get("[data-testid='agent-timeline'] summary").first().click();
    cy.viewport(390, 844);
    cy.document().its("documentElement.scrollWidth").should("be.at.most", 390);
    cy.viewport(1000, 660);

    cy.contains("button", "Encerrar conversa").click();
    cy.contains("button", "Começar conversa").should("be.visible");
    cy.getCookie("agent_session").should("not.exist");
  });
});
