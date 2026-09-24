/**
 * GODZILLA Spotify Stats — E2E sem depender da Spotify real: o "login" é o
 * modo demo com dados mockados (`?data=mock` ignora a vitrine do dono, caso
 * ela esteja configurada no ambiente).
 */
describe("GODZILLA Spotify Stats", () => {
  describe("landing page", () => {
    it("apresenta o produto e os dois caminhos de entrada", () => {
      cy.visit("/spotify");
      cy.get("h1").should("contain.text", "YOUR MUSIC.").and("contain.text", "YOUR STATS.");
      cy.contains("a", "Connect Spotify").should("have.attr", "href", "/api/spotify/login");
      cy.get('[data-testid="view-demo"]').should("be.visible");
      cy.contains("Genre Distribution").should("be.visible");
    });

    it("mostra mensagens amigáveis para erros do OAuth", () => {
      cy.visit("/spotify?error=access_denied");
      cy.get('[role="alert"]').should("contain.text", "cancelled the Spotify authorization");

      cy.visit("/spotify?error=state_mismatch");
      cy.get('[role="alert"]').should("contain.text", "couldn't be verified");
    });

    it("sem sessão, o dashboard volta para a landing", () => {
      cy.clearCookies();
      cy.visit("/spotify/dashboard");
      cy.location("pathname").should("eq", "/spotify");
      cy.get('[role="alert"]').should("contain.text", "session ended");
    });
  });

  it("o botão de explorar abre o dashboard sem login", () => {
    cy.clearCookies();
    cy.visit("/spotify");
    cy.get('[data-testid="view-demo"]').click();
    cy.location("pathname").should("eq", "/spotify/dashboard");
    cy.get('[data-testid="mode-banner"]').should("be.visible");
  });

  describe("modo demo (login mockado)", () => {
    beforeEach(() => {
      cy.viewport(1280, 900);
      cy.visit("/api/spotify/demo?data=mock");
      cy.location("pathname").should("eq", "/spotify/dashboard");
    });

    it("carrega o overview com cards, player e perfil musical", () => {
      cy.contains("h1", "Overview").should("be.visible");
      cy.contains("Demo").should("be.visible");
      // O mock tem gêneros (como quando o Last.fm enriquece os artistas).
      for (const card of ["top-artist", "top-track", "top-genre", "recently-played"]) {
        cy.get(`[data-testid="card-${card}"]`).should("be.visible");
      }
      cy.get('[data-testid="now-playing"]').should("contain.text", "Now playing").find('[role="progressbar"]').should("exist");
      cy.get('[data-testid="music-profile"]').should("contain.text", "Artists analyzed");
      cy.get('[data-testid="genre-distribution"]').should("be.visible");
      cy.get('[data-testid="decade-distribution"]').should("be.visible");
      cy.get("[data-chart]").should("have.length.at.least", 3);
    });

    it("filtra o período", () => {
      cy.get('[data-range="long_term"]').click();
      cy.location("search").should("eq", "?range=long_term");
      cy.get('[data-range="long_term"]').should("have.attr", "aria-current", "page");
      cy.contains("Last year").should("be.visible");
    });

    it("navega entre as seções", () => {
      cy.get('nav[aria-label="Dashboard"]').filter(":visible").contains("Top Artists").click();
      cy.location("pathname").should("eq", "/spotify/artists");
      cy.contains("h1", "Top Artists").should("be.visible");
      cy.get('[data-testid="artist-card"]').should("have.length.greaterThan", 3).first().should("contain.text", "#1");

      cy.get('nav[aria-label="Dashboard"]').filter(":visible").contains("Top Tracks").click();
      cy.location("pathname").should("eq", "/spotify/tracks");
      cy.get('[data-testid="track-row"]').should("have.length.greaterThan", 10);
      cy.get('[data-range="medium_term"]').click();
      cy.location("search").should("eq", "?range=medium_term");

      cy.get('nav[aria-label="Dashboard"]').filter(":visible").contains("Recently Played").click();
      cy.location("pathname").should("eq", "/spotify/recently-played");
      cy.get('[data-testid="timeline-item"]').should("have.length", 50);
    });

    it("sai do demo e volta para a landing", () => {
      cy.get("header").find('button[title="Exit demo"]').click();
      cy.location("pathname").should("eq", "/spotify");
      cy.contains("a", "Connect Spotify").should("be.visible");
    });

    it("no mobile, a tabela vira cards e a navegação continua acessível", () => {
      cy.viewport("iphone-x");
      cy.visit("/spotify/tracks");
      cy.get('[data-testid="track-card"]').first().should("be.visible");
      cy.get('[data-testid="track-row"]').first().should("not.be.visible");
      cy.get('nav[aria-label="Dashboard"]').filter(":visible").should("contain.text", "Recently Played");
      cy.document().then((doc) => {
        expect(doc.documentElement.scrollWidth).to.be.at.most(doc.documentElement.clientWidth);
      });
    });
  });
});
