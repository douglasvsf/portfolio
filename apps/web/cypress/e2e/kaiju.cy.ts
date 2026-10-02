/**
 * Kaiju 3D no topo da home: só carrega em tela grande (e com WebGL); no
 * celular fica a imagem. A cena não pode ser bloqueada pela CSP nem gerar
 * erro no console.
 */
describe("kaiju 3D", () => {
  it("no celular não carrega o 3D: fica a imagem", () => {
    cy.viewport(390, 844);
    cy.visit("/pt-BR");
    cy.get("#hero img[src*='kaiju-poster']").should("exist");
    cy.wait(3000);
    cy.get("[data-testid='kaiju-3d']").should("not.exist");
  });

  it("no desktop a cena carrega por cima da imagem, sem erro e sem bloqueio da CSP", () => {
    cy.viewport(1440, 900);
    const problems: string[] = [];
    cy.visit("/pt-BR", {
      onBeforeLoad(win) {
        win.document.addEventListener("securitypolicyviolation", (event) => problems.push(`CSP ${event.violatedDirective} ${event.blockedURI}`));
        cy.stub(win.console, "error").callsFake((...args: unknown[]) => problems.push(args.map(String).join(" ").slice(0, 200)));
      },
    });

    cy.window().then((win) => {
      const canvas = win.document.createElement("canvas");
      if (!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"))) {
        // Sem WebGL (alguns runners): vale o comportamento de reserva — a imagem continua.
        cy.get("#hero img[src*='kaiju-poster']").should("be.visible");
        return;
      }
      cy.get("[data-testid='kaiju-3d']", { timeout: 30_000 }).should("have.attr", "data-ready", "true");
      cy.get("[data-testid='kaiju-3d'] canvas").should("be.visible").click({ force: true });
      cy.wait(800);
    });
    cy.then(() => expect(problems, "erros ou bloqueios").to.deep.eq([]));
  });

  it("cada clique aumenta a fúria; no décimo ele carrega, solta o sopro atômico e a fúria zera", () => {
    cy.viewport(1440, 900);
    cy.visit("/pt-BR");
    cy.window().then((win) => {
      const canvas = win.document.createElement("canvas");
      if (!(canvas.getContext("webgl2") ?? canvas.getContext("webgl"))) return;

      cy.get("[data-testid='kaiju-3d']", { timeout: 30_000 }).as("kaiju").should("have.attr", "data-ready", "true");
      cy.get("@kaiju").should("have.attr", "data-rage", "0");
      for (let click = 1; click <= 9; click++) {
        cy.get("@kaiju").find("canvas").click({ force: true });
        cy.get("@kaiju").should("have.attr", "data-rage", String(click)).and("have.attr", "data-phase", "calm");
      }
      cy.get("@kaiju").find("canvas").click({ force: true });
      cy.get("@kaiju").should("have.attr", "data-phase", "charging");
      // Durante o disparo, cliques não contam.
      cy.get("@kaiju").find("canvas").click({ force: true });
      cy.get("@kaiju", { timeout: 6000 }).should("have.attr", "data-phase", "firing").and("have.attr", "data-rage", "10");
      cy.get("@kaiju", { timeout: 10_000 }).should("have.attr", "data-phase", "calm").and("have.attr", "data-rage", "0");
    });
  });
});
