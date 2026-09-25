/**
 * Seção Projetos (filtros e cards) e páginas de case (/[lang]/projetos/[slug]).
 */
describe("Projetos", () => {
  beforeEach(() => {
    cy.viewport(1280, 900);
  });

  it("mostra o snapshot e filtra por categoria e por área", () => {
    cy.visit("/pt-BR#projects");
    cy.get("#projects").within(() => {
      cy.contains("Engineering snapshot").should("be.visible");
      cy.contains("dd", "400K+").should("exist");

      cy.get("article").should("have.length", 7);
      cy.contains("button", "Todos").should("have.attr", "aria-pressed", "true");

      cy.contains("button", "Pessoais").click().should("have.attr", "aria-pressed", "true");
      cy.get("article").should("have.length", 3);
      cy.contains("h3", "Profissionais").should("not.exist");
      cy.contains("article", "Kaiju Stocks").find("a").contains("Abrir").should("have.attr", "href", "/stocks");

      cy.contains("button", "Frontend").click();
      cy.get("article").should("have.length", 2);
      cy.contains("article", "Plataforma de mercado de capitais").should("exist");
      cy.contains("article", "GODZILLA UI").should("exist");

      // Nenhum projeto é só back-end: o filtro nem aparece.
      cy.contains("button", "Backend").should("not.exist");

      cy.contains("button", "Profissionais").click();
      cy.get("article").should("have.length", 4);
      cy.contains("article", "QualiCloud").find("a[href='https://qualicloud.online/']").should("have.attr", "target", "_blank");
    });
  });

  it("abre o case, com título próprio, canonical, seções e navegação entre cases", () => {
    cy.visit("/pt-BR#projects");
    cy.contains("article", "Modernização do Discovery").contains("a", "Ver case").click();

    cy.location("pathname").should("eq", "/pt-BR/projetos/pravaler-discovery");
    cy.title().should("eq", "Modernização do Discovery — GODZILLA.DEV");
    // SEO: o que os buscadores recebem é o HTML do servidor (carregamento direto da URL). Depois de
    // navegar no cliente, o Next mantém o canonical da home junto do novo — irrelevante para buscadores.
    cy.request("/pt-BR/projetos/pravaler-discovery")
      .its("body")
      .then((html: string) => {
        expect(html).to.match(/<link rel="canonical" href="[^"]*\/pt-BR\/projetos\/pravaler-discovery"/);
        expect(html).to.match(/<link rel="alternate" hrefLang="en-US" href="[^"]*\/en-US\/projetos\/pravaler-discovery"/);
        expect(html).to.include('<meta property="og:type" content="article"/>');
        expect(html).to.include("<title>Modernização do Discovery — GODZILLA.DEV</title>");
      });

    cy.contains("h1", "Modernização do Discovery").should("be.visible");
    for (const title of ["Contexto", "Desafio", "Minha atuação", "Arquitetura", "Stack", "Escala", "Resultado", "Decisões técnicas"]) {
      cy.contains("h2", title).should("exist");
    }
    cy.contains("li", "WordPress/PHP").should("exist");
    cy.contains("a", "Site da Pravaler").should("have.attr", "href", "https://www.pravaler.com.br/");

    cy.contains("a", "Próximo case").click();
    cy.location("pathname").should("eq", "/pt-BR/projetos/pravaler-canais-epa");
    cy.contains("a", "Voltar aos projetos").should("have.attr", "href", "/pt-BR#projects");
  });

  it("case sem resultado documentado não mostra a seção Resultado", () => {
    cy.visit("/pt-BR/projetos/inoa");
    cy.contains("h1", "Plataforma de mercado de capitais").should("be.visible");
    cy.contains("h2", "Resultado").should("not.exist");
  });

  it("/projetos/… sem idioma redireciona; slug inexistente é 404; case em inglês", () => {
    cy.setCookie("NEXT_LOCALE", "en-US");
    cy.visit("/projetos/qualicloud");
    cy.location("pathname").should("eq", "/en-US/projetos/qualicloud");
    cy.title().should("eq", "SaaS products — GODZILLA.DEV");

    cy.request({ url: "/pt-BR/projetos/nao-existe", failOnStatusCode: false }).its("status").should("eq", 404);
  });

  it("experiência linka o site de cada empresa", () => {
    cy.visit("/pt-BR#experience");
    cy.get("#experience").within(() => {
      cy.get("a[href='https://cristofoli.com/']").should("have.attr", "rel", "noopener noreferrer");
      cy.get("a[href='https://inoa.com/']").should("exist");
      cy.get("a[href='https://www.pravaler.com.br/']").should("have.length", 2);
    });
  });
});
