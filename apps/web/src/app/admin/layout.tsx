import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { AppBrand, AppFooter, AppHeader, I18nProvider, appContainerClassName, cn } from "@godzilla/ui";
import { BackToPortfolio } from "@/components/layout/back-to-portfolio";
import { SITE_URL } from "@/config/site";
import "../globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: { default: "Painel do site", template: "%s · Painel do site" },
  robots: { index: false, follow: false },
};

/** Painel administrativo do portfólio: área privada do dono do site, fora dos idiomas e dos buscadores. */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="pt-BR" className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <I18nProvider locale="pt-BR">
          <AppHeader
            skipToContent={{ label: "Pular para o conteúdo" }}
            brand={
              <AppBrand asChild>
                <Link href="/admin">
                  GODZILLA.DEV<span className="text-primary">/ADMIN</span>
                </Link>
              </AppBrand>
            }
            actions={<BackToPortfolio label="Voltar ao portfólio" />}
          />
          <main id="content" className={cn(appContainerClassName, "flex-1 py-8")}>
            {children}
          </main>
          <AppFooter>Área privada do portfólio.</AppFooter>
        </I18nProvider>
      </body>
    </html>
  );
}
