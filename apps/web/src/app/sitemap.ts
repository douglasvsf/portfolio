import type { MetadataRoute } from "next";
import { SITE_URL } from "@/config/site";
import { CASE_IDS } from "@/content/projects";
import { locales } from "@/i18n/config";

/** Home e cases em todos os idiomas (com hreflang), mais as páginas públicas do Kaiju Stocks. */
export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => new URL(path, SITE_URL).toString();
  const localized = (path: string, priority: number): MetadataRoute.Sitemap =>
    locales.map((locale) => ({
      url: url(`/${locale}${path}`),
      priority,
      alternates: { languages: Object.fromEntries(locales.map((other) => [other, url(`/${other}${path}`)])) },
    }));

  return [
    ...localized("", 1),
    ...CASE_IDS.flatMap((id) => localized(`/projetos/${id}`, 0.8)),
    { url: url("/stocks"), priority: 0.6 },
    { url: url("/stocks/carteira"), priority: 0.5 },
  ];
}
