import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppFooter, I18nProvider, appNavLinkClassName } from "@godzilla/ui";
import "../globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const title = "GODZILLA Spotify Stats";
const description = "Visualize suas estatísticas musicais do Spotify.";

export const metadata: Metadata = {
  title: { default: title, template: `%s · ${title}` },
  description,
  applicationName: title,
  openGraph: { title, description, type: "website", siteName: title, url: "/spotify" },
  twitter: { card: "summary_large_image", title, description },
};

export default function SpotifyRootLayout({ children }: LayoutProps<"/spotify">) {
  return (
    <html lang="en" className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <I18nProvider locale="en-US">
          {children}
          <AppFooter
            aside={
              <a href="https://www.spotify.com" target="_blank" rel="noreferrer" className={appNavLinkClassName}>
                Data provided by Spotify
              </a>
            }
          >
            GODZILLA Spotify Stats is an independent project, not affiliated with or endorsed by Spotify.
          </AppFooter>
        </I18nProvider>
      </body>
    </html>
  );
}
