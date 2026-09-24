import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Geist, Geist_Mono } from "next/font/google";
import { I18nProvider } from "@godzilla/ui";
import { getContent } from "@/content";
import { SITE_URL } from "@/config/site";
import { DEFAULT_LOCALE, isLocale, locales } from "@/i18n/config";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Só os idiomas suportados existem; qualquer outro segmento vira 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};

  const { meta } = getContent(lang);
  return {
    // metadataBase torna canonical/hreflang/Open Graph absolutos (exigência dos buscadores).
    metadataBase: SITE_URL,
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: `/${lang}`,
      languages: {
        ...Object.fromEntries(locales.map((locale) => [locale, `/${locale}`])),
        "x-default": `/${DEFAULT_LOCALE}`,
      },
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      locale: lang.replace("-", "_"),
      url: `/${lang}`,
      type: "website",
    },
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  return (
    <html lang={lang} className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <I18nProvider locale={lang}>{children}</I18nProvider>
      </body>
    </html>
  );
}
