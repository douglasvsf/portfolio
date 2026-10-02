/**
 * Compartilhamento e busca: toda página pública tem imagem de compartilhamento
 * (1200×630, PNG) e dados estruturados válidos.
 */
const imageOf = (path: string) =>
  cy.request(path).then(({ body }) => {
    const html = String(body);
    const image = /<meta property="og:image" content="([^"]+)"/.exec(html)?.[1]?.replace(/&amp;/g, "&");
    expect(image, `og:image de ${path}`).to.be.a("string");
    expect(html).to.contain('<meta property="og:image:width" content="1200"');
    expect(html).to.contain('<meta name="twitter:card" content="summary_large_image"');
    return new URL(image!).pathname + new URL(image!).search;
  });

describe("SEO e compartilhamento", () => {
  it("home e case têm imagem de compartilhamento em PNG, por idioma", () => {
    for (const path of ["/pt-BR", "/en-US", "/es-ES/projetos/godzilla-erp"]) {
      imageOf(path).then((image) => {
        expect(image).to.contain(`${path}/opengraph-image`);
        cy.request({ url: image, encoding: "binary" }).then((response) => {
          expect(response.status).to.eq(200);
          expect(response.headers["content-type"]).to.eq("image/png");
          expect(response.body.length).to.be.greaterThan(20_000);
        });
      });
    }
  });

  it("dados estruturados: pessoa na home e artigo no case", () => {
    const graphOf = (path: string) =>
      cy.request(path).then(({ body }) => {
        const json = /<script type="application\/ld\+json">(.*?)<\/script>/s.exec(String(body))?.[1];
        expect(json, `JSON-LD de ${path}`).to.be.a("string");
        return JSON.parse(json!)["@graph"] as Record<string, unknown>[];
      });

    graphOf("/pt-BR").then((graph) => {
      const person = graph.find((node) => node["@type"] === "Person")!;
      expect(person.name).to.eq("Douglas Szapak");
      expect(person.knowsAbout).to.include("React");
      expect(graph.some((node) => node["@type"] === "WebSite")).to.eq(true);
    });
    graphOf("/pt-BR/projetos/pravaler-discovery").then((graph) => {
      expect(graph.map((node) => node["@type"])).to.deep.eq(["TechArticle", "BreadcrumbList"]);
    });
  });
});
