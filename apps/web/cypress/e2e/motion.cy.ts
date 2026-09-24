/**
 * Animações de entrada ao rolar (Motion). O risco de "revelar ao rolar" é
 * conteúdo ficar preso invisível — então rolamos como uma pessoa rola e
 * conferimos que tudo termina visível.
 */
const hidden = (doc: Document) =>
  [...doc.querySelectorAll("main [style*='opacity']")].filter((el) => Number(getComputedStyle(el).opacity) < 0.99);

/** Rola a página inteira aos poucos, como a roda do mouse (a página usa scroll-behavior: smooth). */
const scrollThroughPage = () =>
  cy.document().then((doc) => {
    const steps = Math.ceil(doc.documentElement.scrollHeight / 400) + 2;
    for (let step = 0; step < steps; step++) {
      cy.window().then((win) => win.scrollBy({ top: 400, behavior: "instant" }));
      cy.wait(80);
    }
  });

describe("Animações ao rolar", () => {
  it("o hero aparece de cara; o resto se revela ao rolar e nada fica invisível", () => {
    cy.viewport(1280, 900);
    cy.visit("/pt-BR");
    cy.get("#hero-title").should("be.visible");
    cy.document().then((doc) => expect(hidden(doc).length, "blocos esperando a rolagem").to.be.greaterThan(5));

    scrollThroughPage();
    cy.wait(1200);
    cy.document().then((doc) => expect(hidden(doc).map((el) => el.textContent?.slice(0, 30)), "tudo visível ao final").to.deep.equal([]));
  });

  it("com movimento reduzido no sistema, o conteúdo só esmaece — sem se mover", () => {
    cy.visit("/pt-BR", {
      onBeforeLoad(win) {
        const original = win.matchMedia.bind(win);
        win.matchMedia = (query: string) =>
          query.includes("prefers-reduced-motion")
            ? ({ matches: true, media: query, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false } as MediaQueryList)
            : original(query);
      },
    });

    // Grava cada mudança de estilo do bloco do título enquanto ele aparece.
    const frames: { opacity: number; transform: string }[] = [];
    cy.get("#engineering-title").then(($title) => {
      const block = $title.closest("[style]")[0] as HTMLElement;
      const record = () => frames.push({ opacity: Number(getComputedStyle(block).opacity), transform: getComputedStyle(block).transform });
      new MutationObserver(record).observe(block, { attributes: true, attributeFilter: ["style"] });
    });
    cy.get("#engineering").scrollIntoView({ duration: 300 });

    cy.get("#engineering-title").closest("[style]").should(($block) => expect(Number(getComputedStyle($block[0]).opacity)).to.equal(1));
    cy.then(() => {
      const moving = frames.filter((frame) => frame.opacity > 0 && !["none", "matrix(1, 0, 0, 1, 0, 0)"].includes(frame.transform));
      expect(frames.length, "houve transição").to.be.greaterThan(0);
      expect(moving, "nenhum quadro visível com deslocamento").to.deep.equal([]);
    });
  });
});
