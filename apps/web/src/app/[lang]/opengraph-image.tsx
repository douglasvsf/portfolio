import { getContent } from "@/content";
import { DEFAULT_LOCALE, isLocale, locales } from "@/i18n/config";
import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "@/lib/seo/og-image";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = "Douglas Szapak — GODZILLA.DEV";

/** Uma imagem por idioma, gerada no build (não a cada visita). */
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

/** Cartão de compartilhamento da home, um por idioma. */
export default async function Image({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  const { meta, hero } = getContent(isLocale(lang) ? lang : DEFAULT_LOCALE);
  return renderOgImage({
    eyebrow: hero.prompt,
    title: hero.title.toUpperCase().split(" ").join("\n"),
    // "Douglas Szapak — Engenheiro de Software Full Stack Sênior" → só o cargo.
    subtitle: meta.title.split(" — ")[1] ?? hero.subtitle,
    tags: ["React", "Next.js", "Node.js", "TypeScript"],
  });
}
