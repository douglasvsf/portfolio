import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppFooter, I18nProvider, appNavLinkClassName } from "@godzilla/ui";
import { getSpotifyDictionary } from "@/content/spotify";
import { getRequestLocale } from "@/i18n/request";
import "../globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const title = "GODZILLA Spotify Stats";

export async function generateMetadata(): Promise<Metadata> {
  const { description } = getSpotifyDictionary(await getRequestLocale()).meta;
  return {
    title: { default: title, template: `%s · ${title}` },
    description,
    applicationName: title,
    openGraph: { title, description, type: "website", siteName: title, url: "/spotify" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function SpotifyRootLayout({ children }: LayoutProps<"/spotify">) {
  const locale = await getRequestLocale();
  const { common } = getSpotifyDictionary(locale);

  return (
    <html lang={locale} className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <I18nProvider locale={locale}>
          {children}
          <AppFooter
            aside={
              <span className="flex gap-4">
                <a href="https://www.spotify.com" target="_blank" rel="noreferrer" className={appNavLinkClassName}>
                  {common.dataBySpotify}
                </a>
                <a href="https://www.last.fm" target="_blank" rel="noreferrer" className={appNavLinkClassName}>
                  {common.poweredByLastfm}
                </a>
              </span>
            }
          >
            {common.footer}
          </AppFooter>
        </I18nProvider>
      </body>
    </html>
  );
}
