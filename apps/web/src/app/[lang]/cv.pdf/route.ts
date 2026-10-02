import { CV_COPY } from "@/content/cv";
import { isLocale, locales } from "@/i18n/config";
import { buildCvPdf } from "@/lib/cv/pdf";

/** Currículo em PDF de cada idioma (/pt-BR/cv.pdf), gerado uma vez no build a partir do conteúdo do site. */
export const dynamic = "force-static";

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function GET(_: Request, { params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) return new Response(null, { status: 404 });

  const pdf = await buildCvPdf(lang);
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${CV_COPY[lang].fileName}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
