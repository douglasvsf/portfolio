import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ScrollProgress } from "@/components/motion/motion";
import { ProjectCase } from "@/components/projects/case/project-case";
import { getContent } from "@/content";
import { CASE_IDS, adjacentCases, getProject } from "@/content/projects";
import { DEFAULT_LOCALE, isLocale, locales, type Locale } from "@/i18n/config";
import { fmt } from "@/i18n/message";

/** Só os cases existentes: qualquer outro slug vira 404. */
export const dynamicParams = false;

/** Páginas estáticas: um case por idioma. */
export function generateStaticParams() {
  return locales.flatMap((lang) => CASE_IDS.map((slug) => ({ lang, slug })));
}

function load(lang: string, slug: string) {
  if (!isLocale(lang)) return null;
  const project = getProject(lang, slug);
  if (!project?.case) return null;
  return { lang, project: { ...project, case: project.case } };
}

export async function generateMetadata({ params }: PageProps<"/[lang]/projetos/[slug]">): Promise<Metadata> {
  const { lang, slug } = await params;
  const loaded = load(lang, slug);
  if (!loaded) return {};

  const { project } = loaded;
  const title = fmt(getContent(loaded.lang).projects.case.metaTitle, { title: project.title });
  const path = (locale: Locale) => `/${locale}/projetos/${slug}`;
  return {
    title: { absolute: title },
    description: project.summary,
    alternates: {
      canonical: path(loaded.lang),
      languages: {
        ...Object.fromEntries(locales.map((locale) => [locale, path(locale)])),
        "x-default": path(DEFAULT_LOCALE),
      },
    },
    openGraph: {
      type: "article",
      title,
      description: project.summary,
      url: path(loaded.lang),
      locale: loaded.lang.replace("-", "_"),
    },
  };
}

export default async function ProjectCasePage({ params }: PageProps<"/[lang]/projetos/[slug]">) {
  const { lang, slug } = await params;
  const loaded = load(lang, slug);
  if (!loaded) notFound();

  const { nav, footer, projects } = getContent(loaded.lang);
  const { previous, next } = adjacentCases(loaded.lang, slug);
  // O menu aponta para seções da home: aqui os links precisam do caminho completo.
  const links = nav.links.map((link) => ({ ...link, href: `/${loaded.lang}${link.href}` }));

  return (
    <>
      <ScrollProgress />
      <SiteHeader brand={nav.brand} brandHref={`/${loaded.lang}`} links={links} locale={loaded.lang} skipToContent={nav.skipToContent} />
      <main id="content" className="relative flex-1">
        <div className="bg-grid pointer-events-none absolute inset-x-0 top-0 h-[480px] opacity-30 [mask-image:linear-gradient(to_bottom,black,transparent)]" aria-hidden="true" />
        <div className="relative">
          <ProjectCase project={loaded.project} copy={projects} locale={loaded.lang} previous={previous} next={next} />
        </div>
      </main>
      <SiteFooter {...footer} />
    </>
  );
}
