/**
 * GODZILLA Pay de ponta a ponta: site (BFF) → API NestJS → PostgreSQL embutido.
 * Loja de teste, cobrança com QR Code, pagamento simulado, estorno, livro-caixa
 * e webhooks com destino fora do ar e reenvio.
 */
describe("GODZILLA Pay", () => {
  it("cobra, recebe, estorna e mostra o livro-caixa e os webhooks", () => {
    cy.visit("/pay");
    cy.contains("h1", "GODZILLA").should("be.visible");
    cy.contains("button", "Criar minha loja de teste").click();
    cy.location("pathname", { timeout: 20_000 }).should("eq", "/pay/cobrancas");
    cy.contains("Loja Kaiju").should("be.visible");
    cy.getCookie("pay_session").should("have.property", "httpOnly", true);

    // Validação no servidor do site, antes da API.
    cy.get("[data-testid='charge-form']").within(() => {
      cy.contains("button", "Gerar cobrança Pix").click();
      cy.contains("Informe um valor entre R$ 0,01").should("be.visible");
      cy.get("input[name='amount']").type("12345");
      cy.get("input[name='amount']").should("have.value", "123,45");
      cy.get("input[name='description']").type("Pedido 1042");
      cy.get("input[name='customerName']").type("Ana Souza");
      cy.get("input[name='customerDocument']").type("39053344705");
      cy.contains("button", "Gerar cobrança Pix").click();
    });

    cy.location("pathname", { timeout: 20_000 }).should("match", /^\/pay\/cobrancas\/[0-9a-f-]{36}$/);
    cy.contains("h1", "R$ 123,45").should("be.visible");
    cy.contains("Aguardando pagamento").should("be.visible");
    cy.get("[data-testid='pix-qr'] svg").should("be.visible");
    cy.get("[data-testid='br-code']").invoke("text").should("match", /^000201010212.*5406123\.45.*6304[0-9A-F]{4}$/);
    cy.contains("Nada lançado ainda").should("be.visible");

    cy.contains("button", "Simular pagamento").click();
    cy.contains("Pago em", { timeout: 20_000 }).should("be.visible");
    cy.get("[data-testid='pix-qr']").should("not.exist");
    // O real formatado usa espaço não separável depois do "R$": \s cobre os dois.
    cy.contains("tr", "Liquidação Pix").invoke("text").should("match", /R\$\s123,45/);
    cy.contains("tr", "Saldo da loja").invoke("text").should("match", /R\$\s122,23/);
    cy.contains("tr", "Receita de taxas").invoke("text").should("match", /R\$\s1,22/);

    cy.get("[data-testid='refund-form']").within(() => {
      cy.get("input[name='amount']").type("2000");
      cy.contains("button", "Estornar").click();
    });
    cy.contains("Estornada em parte", { timeout: 20_000 }).should("be.visible");
    cy.get("[data-testid='refund-form']").within(() => {
      cy.get("input[name='amount']").type("99999");
      cy.contains("button", "Estornar").click();
      cy.contains("Valor acima do que resta").should("be.visible");
    });

    cy.contains("a", "Cobranças").click();
    cy.contains("Livro-caixa da plataforma balanceado").should("be.visible");
    cy.contains(/R\$\s102,23/).should("be.visible"); // 122,23 − 20,00 de estorno
    cy.contains("tr", "Pedido 1042").should("contain", "Estornada em parte");

    // Webhooks: os três eventos entregues no inspetor, com assinatura conferida.
    cy.get("header nav").contains("a", "Webhooks").click();
    cy.get("[data-testid='deliveries'] > li").should("have.length", 3);
    cy.get("[data-testid='deliveries']").should("contain", "charge.refunded").and("contain", "charge.paid").and("contain", "charge.created");
    cy.get("[data-testid='inspector'] > li").should("have.length", 3).each((item) => cy.wrap(item).should("contain", "assinatura confere"));

    // Destino fora do ar: a entrega falha, fica agendada e o reenvio manual entrega.
    cy.get("[data-testid='webhook-settings']").within(() => {
      cy.get("select[name='failNext']").select("2"); // cobrança criada e paga: as duas entregas falham
      cy.contains("button", "Salvar").click();
      cy.contains("Configuração salva.").should("be.visible");
    });
    cy.get("header nav").contains("a", "Cobranças").click();
    cy.get("[data-testid='charge-form']").within(() => {
      cy.get("input[name='amount']").type("500");
      cy.contains("button", "Gerar cobrança Pix").click();
    });
    cy.contains("button", "Simular pagamento", { timeout: 20_000 }).click();
    cy.contains("Pago em", { timeout: 20_000 }).should("be.visible");
    cy.visit("/pay/webhooks");
    cy.get("[data-testid='deliveries'] > li")
      .first()
      .within(() => {
        cy.contains("Nova tentativa agendada").should("be.visible");
        cy.contains("HTTP 500").should("be.visible");
        cy.contains("button", "Reenviar agora").click();
      });
    cy.get("[data-testid='deliveries'] > li", { timeout: 20_000 })
      .first()
      .within(() => {
        cy.contains("Entregue").should("be.visible");
        cy.contains("tentativa 2").should("contain", "HTTP 200");
      });

    // Integração: chave mascarada até pedir para mostrar.
    cy.get("header nav").contains("a", "Integração").click();
    cy.get("[data-testid='secret-Chave de API']").invoke("text").should("match", /^gz_test_\w{4}•+$/);
    cy.contains("button", "Mostrar").click();
    cy.get("[data-testid='secret-Chave de API']").invoke("text").should("match", /^gz_test_[A-Za-z0-9_-]{32}$/);

    cy.contains("button", "Sair").click();
    cy.location("pathname").should("eq", "/pay");
    cy.getCookie("pay_session").should("not.exist");
  });

  it("sem loja, as telas internas voltam para a entrada", () => {
    cy.visit("/pay/cobrancas");
    cy.location("pathname").should("eq", "/pay");
    cy.contains("Sua loja de teste expirou").should("be.visible");
  });
});
