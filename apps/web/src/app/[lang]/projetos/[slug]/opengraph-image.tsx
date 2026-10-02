import { getContent } from "@/content";
import { CASE_IDS, getProject } from "@/content/projects";
import { DEFAULT_LOCALE, isLocale, locales } from "@/i18n/config";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/seo/og-image";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Case — GODZILLA.DEV";

/** Uma imagem por case e idioma, gerada no build (não a cada visita). */
export function generateStaticParams() {
  return locales.flatMap((lang) => CASE_IDS.map((slug) => ({ lang, slug })));
}

/** Cartão de compartilhamento de cada case: empresa, título, stack e os números documentados. */
export default async function Image({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const { lang, slug } = await params;
  const locale = isLocale(lang) ? lang : DEFAULT_LOCALE;
  const project = getProject(locale, slug);
  const { projects } = getContent(locale);
  if (!project) return renderOgImage({ eyebrow: "$ ls projetos", title: "GODZILLA.DEV", subtitle: "Douglas Szapak" });

  const metrics = project.metrics.slice(0, 3).map((metric) => `${metric.value} ${metric.label}`);
  return renderOgImage({
    eyebrow: `${project.company ?? projects.personalBadge} · ${project.period}`,
    title: project.title,
    subtitle: project.technologies.slice(0, 3).join(" · "),
    tags: metrics.length ? metrics : project.technologies.slice(3, 6),
  });
}
