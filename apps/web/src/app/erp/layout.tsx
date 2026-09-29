import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { AppBrand, AppFooter, AppHeader, I18nProvider, appContainerClassName, appNavLinkClassName, cn } from "@godzilla/ui";
import { BackToPortfolio } from "@/components/layout/back-to-portfolio";
import { ErpNav } from "@/components/erp/erp-nav";
import { SessionBar } from "@/components/erp/session-bar";
import { SITE_URL } from "@/config/site";
import { getSession } from "@/lib/erp/session";
import "../globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: { default: "GODZILLA ERP — mini-ERP de mercado", template: "%s · GODZILLA ERP" },
  description:
    "Mini-ERP de demonstração: produtos, estoque, clientes, pedidos e dashboard. Cada visitante ganha uma empresa isolada, com API em NestJS e MongoDB.",
};

/** O ERP é só em pt-BR (decisão do MVP) e usa o mesmo shell do Design System dos outros sistemas. */
export default async function ErpLayout({ children }: LayoutProps<"/erp">) {
  const session = await getSession();

  return (
    <html lang="pt-BR" className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <I18nProvider locale="pt-BR">
          <AppHeader
            skipToContent={{ label: "Pular para o conteúdo" }}
            brand={
              <AppBrand asChild>
                <Link href={session ? "/erp/dashboard" : "/erp"}>
                  GODZILLA<span className="text-primary">/ERP</span>
                </Link>
              </AppBrand>
            }
            actions={<BackToPortfolio label="Voltar ao portfólio" />}
            below={
              session ? (
                <div className="border-t border-border">
                  <div className={cn(appContainerClassName, "flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between")}>
                    <ErpNav className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none]" />
                    <SessionBar session={session} />
                  </div>
                </div>
              ) : undefined
            }
          />
          <main id="content" className={cn(appContainerClassName, "flex-1 py-8")}>
            {children}
          </main>
          <AppFooter
            aside={
              <a href="https://github.com/douglasvsf/portfolio/tree/main/apps/api" target="_blank" rel="noreferrer" className={appNavLinkClassName}>
                Código da API
              </a>
            }
          >
            Demonstração: dados fictícios de um mercado, apagados automaticamente em 24h.
          </AppFooter>
        </I18nProvider>
      </body>
    </html>
  );
}
