import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { AppBrand, AppFooter, AppHeader, I18nProvider, appContainerClassName, appNavLinkClassName, cn } from "@godzilla/ui";
import { BackToPortfolio } from "@/components/layout/back-to-portfolio";
import { SystemLocaleSwitcher } from "@/components/layout/system-locale-switcher";
import { StocksNav } from "@/components/stocks/stocks-nav";
import { SITE_URL } from "@/config/site";
import { getStocksDictionary } from "@/content/stocks";
import { getRequestLocale } from "@/i18n/request";
import "../globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const { meta } = getStocksDictionary(await getRequestLocale());
  return { metadataBase: SITE_URL, title: { default: meta.title, template: "%s · Kaiju Stocks" }, description: meta.description };
}

export default async function RootLayout({ children }: LayoutProps<"/stocks">) {
  const locale = await getRequestLocale();
  const dict = getStocksDictionary(locale);

  return (
    <html lang={locale} className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <I18nProvider locale={locale}>
          <AppHeader
            skipToContent={{ label: dict.layout.skipToContent }}
            brand={
              <AppBrand asChild>
                <Link href="/stocks">
                  KAIJU<span className="text-primary">/STOCKS</span>
                </Link>
              </AppBrand>
            }
            actions={
              <div className="flex items-center gap-4 sm:gap-6">
                <BackToPortfolio label={dict.layout.backToPortfolio} />
                <SystemLocaleSwitcher locale={locale} />
              </div>
            }
            // Segunda linha, como no Spotify Stats: com as bandeiras, a barra principal ficaria apertada no mobile.
            below={
              <div className="border-t border-border">
                <StocksNav className={cn(appContainerClassName, "overflow-x-auto py-3 [scrollbar-width:none]")} />
              </div>
            }
          />
          <main id="content" className={cn(appContainerClassName, "flex-1 py-8")}>
            {children}
          </main>
          <AppFooter
            aside={
              <a href="https://brapi.dev" target="_blank" rel="noreferrer" className={appNavLinkClassName}>
                {dict.layout.dataSource}
              </a>
            }
          >
            {dict.layout.footer}
          </AppFooter>
        </I18nProvider>
      </body>
    </html>
  );
}
