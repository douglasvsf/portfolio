import { SITE_URL } from "@/config/site";
import { CONTACT, PROFILE_PHOTO, REPO_URL } from "@/content/shared";
import type { Locale } from "@/i18n/config";

/**
 * Dados estruturados (schema.org em JSON-LD): contam ao Google, em formato de
 * máquina, quem é a pessoa do site e do que trata cada página — é o que
 * alimenta o painel de conhecimento e os resultados enriquecidos.
 */

const absolute = (path: string) => new URL(path, SITE_URL).toString();
const PERSON_ID = absolute("/#person");
const GITHUB_PROFILE = REPO_URL.split("/").slice(0, 4).join("/");

/** Um <script type="application/ld+json">. `<` é escapado: o texto nunca fecha a tag nem vira HTML. */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}

interface PersonInput {
  locale: Locale;
  jobTitle: string;
  description: string;
  /** Tecnologias e práticas (seção Skills). */
  knowsAbout: string[];
}

/** A home: a pessoa e o site. */
export function homeJsonLd({ locale, jobTitle, description, knowsAbout }: PersonInput) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Person",
        "@id": PERSON_ID,
        name: "Douglas Szapak",
        alternateName: "Douglas Vinicius Szapak Ferreira",
        jobTitle,
        description,
        url: absolute(`/${locale}`),
        image: absolute(PROFILE_PHOTO.src),
        email: `mailto:${CONTACT.email}`,
        sameAs: [CONTACT.linkedinUrl, GITHUB_PROFILE],
        knowsAbout,
        nationality: { "@type": "Country", name: "Brazil" },
      },
      {
        "@type": "WebSite",
        "@id": absolute("/#website"),
        name: "GODZILLA.DEV",
        url: absolute(`/${locale}`),
        inLanguage: locale,
        author: { "@id": PERSON_ID },
      },
    ],
  };
}

interface CaseInput {
  locale: Locale;
  slug: string;
  title: string;
  summary: string;
  technologies: string[];
  company?: string;
}

/** Página de case: um artigo técnico do autor, com o caminho de volta (migalhas). */
export function caseJsonLd({ locale, slug, title, summary, technologies, company }: CaseInput) {
  const url = absolute(`/${locale}/projetos/${slug}`);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "TechArticle",
        headline: title,
        description: summary,
        url,
        inLanguage: locale,
        image: `${url}/opengraph-image`,
        keywords: technologies.join(", "),
        author: { "@type": "Person", "@id": PERSON_ID, name: "Douglas Szapak", url: absolute(`/${locale}`) },
        ...(company ? { about: { "@type": "Organization", name: company } } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "GODZILLA.DEV", item: absolute(`/${locale}`) },
          { "@type": "ListItem", position: 2, name: title, item: url },
        ],
      },
    ],
  };
}
