import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { I18nProvider } from "@godzilla/ui";
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

export const viewport: Viewport = { themeColor: "#0B0B0B", colorScheme: "dark" };

export default function SpotifyRootLayout({ children }: LayoutProps<"/spotify">) {
  return (
    <html lang="en" className={`dark theme-spotify ${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <I18nProvider locale="en-US">
          {children}
          <footer className="border-t border-border px-4 py-6 text-center text-caption text-muted-foreground">
            Data provided by{" "}
            <a href="https://www.spotify.com" className="text-foreground underline-offset-4 hover:underline" rel="noreferrer" target="_blank">
              Spotify
            </a>
            . GODZILLA Spotify Stats is an independent project, not affiliated with or endorsed by Spotify.
          </footer>
        </I18nProvider>
      </body>
    </html>
  );
}
