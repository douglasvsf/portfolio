import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { AppBrand, AppFooter, AppHeader, I18nProvider, appContainerClassName, appNavLinkClassName, cn } from "@godzilla/ui";
import { BackToPortfolio } from "@/components/layout/back-to-portfolio";
import "../globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Kaiju Stocks — cotações da B3", template: "%s · Kaiju Stocks" },
  description: "Consulte ações da B3, maiores altas e quedas, volume por setor e histórico de preços.",
};

export default function RootLayout({ children }: LayoutProps<"/stocks">) {
  return (
    <html lang="pt-BR" className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <I18nProvider locale="pt-BR">
          <AppHeader
            skipToContent={{ label: "Pular para o conteúdo" }}
            brand={
              <AppBrand asChild>
                <Link href="/stocks">
                  KAIJU<span className="text-primary">/STOCKS</span>
                </Link>
              </AppBrand>
            }
            actions={<BackToPortfolio label="Voltar ao portfólio" shortLabel="Portfólio" />}
          />
          <main id="content" className={cn(appContainerClassName, "flex-1 py-8")}>
            {children}
          </main>
          <AppFooter
            aside={
              <a href="https://brapi.dev" target="_blank" rel="noreferrer" className={appNavLinkClassName}>
                Dados: brapi.dev
              </a>
            }
          >
            Cotações com atraso de até 15 minutos. Não é recomendação de investimento.
          </AppFooter>
        </I18nProvider>
      </body>
    </html>
  );
}
