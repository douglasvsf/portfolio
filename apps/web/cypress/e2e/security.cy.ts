/**
 * Cabeçalhos de segurança e Content Security Policy. Além de conferir os
 * cabeçalhos, abre as páginas principais e falha se o navegador bloquear
 * qualquer recurso pela CSP — a política não pode quebrar o próprio site.
 */
const PAGES = ["/pt-BR", "/en-US/projetos/godzilla-erp", "/stocks", "/stocks/carteira", "/spotify", "/erp", "/pt-BR/nao-existe"];

describe("segurança do site", () => {
  it("responde com os cabeçalhos de segurança", () => {
    cy.request("/pt-BR").then(({ headers }) => {
      expect(headers).not.to.have.property("x-powered-by");
      expect(headers["x-content-type-options"]).to.eq("nosniff");
      expect(headers["x-frame-options"]).to.eq("DENY");
      expect(headers["referrer-policy"]).to.eq("strict-origin-when-cross-origin");
      expect(headers["permissions-policy"]).to.contain("camera=()");
      const csp = String(headers["content-security-policy"]);
      expect(csp).to.contain("default-src 'self'");
      expect(csp).to.contain("frame-ancestors 'none'");
      expect(csp).to.contain("object-src 'none'");
      expect(csp).not.to.contain("unsafe-eval");
    });
  });

  it("nenhuma página tem recurso bloqueado pela CSP", () => {
    for (const path of PAGES) {
      const violations: string[] = [];
      cy.visit(path, {
        failOnStatusCode: false,
        onBeforeLoad(win) {
          win.document.addEventListener("securitypolicyviolation", (event) => violations.push(`${event.violatedDirective} ${event.blockedURI}`));
        },
      });
      cy.get("h1").should("exist");
      cy.wait(500);
      cy.then(() => expect(violations, `CSP em ${path}`).to.deep.eq([]));
    }
  });
});
