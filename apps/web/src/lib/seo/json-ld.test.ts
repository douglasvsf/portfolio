import { caseJsonLd, homeJsonLd } from "./json-ld";

/** Os nós do grafo, sem o tipo exato de cada um (o teste confere os campos). */
const nodes = (data: { "@graph": object[] }) => data["@graph"] as Record<string, unknown>[];

describe("dados estruturados (JSON-LD)", () => {
  it("home: pessoa com cargo, perfis e skills, ligada ao site", () => {
    const [person, site] = nodes(homeJsonLd({ locale: "pt-BR", jobTitle: "Engenheiro de Software", description: "Resumo", knowsAbout: ["React", "Node.js"] }));
    expect(person).toMatchObject({ "@type": "Person", name: "Douglas Szapak", jobTitle: "Engenheiro de Software", knowsAbout: ["React", "Node.js"] });
    expect(person!.sameAs).toEqual([expect.stringContaining("linkedin.com/in/"), "https://github.com/douglasvsf"]);
    expect(person!.url).toMatch(/\/pt-BR$/);
    expect(person!.image).toMatch(/^https?:\/\/.+\/images\/douglas\.jpg$/);
    expect(site).toMatchObject({ "@type": "WebSite", name: "GODZILLA.DEV", inLanguage: "pt-BR", author: { "@id": person!["@id"] } });
  });

  it("case: artigo técnico do mesmo autor, com migalhas e a imagem de compartilhamento", () => {
    const [article, breadcrumbs] = nodes(caseJsonLd({ locale: "en-US", slug: "inoa", title: "Capital markets platform", summary: "Resumo", technologies: ["React", "AngularJS"], company: "Inoa" }));
    expect(article).toMatchObject({ "@type": "TechArticle", headline: "Capital markets platform", keywords: "React, AngularJS", about: { name: "Inoa" } });
    expect(article!.url).toMatch(/\/en-US\/projetos\/inoa$/);
    expect(article!.image).toMatch(/\/en-US\/projetos\/inoa\/opengraph-image$/);
    expect(breadcrumbs!.itemListElement).toHaveLength(2);
    expect(nodes(caseJsonLd({ locale: "pt-BR", slug: "x", title: "T", summary: "S", technologies: [] }))[0]).not.toHaveProperty("about");
  });
});
