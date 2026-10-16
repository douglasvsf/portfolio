import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { AppBrand, AppFooter, AppHeader, I18nProvider, appContainerClassName, appNavLinkClassName, cn } from "@godzilla/ui";
import { BackToPortfolio } from "@/components/layout/back-to-portfolio";
import { SITE_URL } from "@/config/site";
import "../globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: { default: "Kaiju Agent — IA que opera o ERP e o Pay", template: "%s · Kaiju Agent" },
  description:
    "Um agente de IA que opera o GODZILLA ERP e o GODZILLA Pay em linguagem natural: consulta, cria pedidos e cobranças Pix — sempre pedindo sua confirmação antes de mudar dados.",
};

/** Só em pt-BR, como o ERP e o Pay, no mesmo shell do Design System. */
export default function AgentLayout({ children }: LayoutProps<"/agente">) {
  return (
    <html lang="pt-BR" className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <I18nProvider locale="pt-BR">
          <AppHeader
            skipToContent={{ label: "Pular para o conteúdo" }}
            brand={
              <AppBrand asChild>
                <Link href="/agente">
                  KAIJU<span className="text-primary">/AGENT</span>
                </Link>
              </AppBrand>
            }
            actions={<BackToPortfolio label="Voltar ao portfólio" />}
          />
          <main id="content" className={cn(appContainerClassName, "flex-1 py-8")}>
            {children}
          </main>
          <AppFooter
            aside={
              <a href="https://github.com/douglasvsf/portfolio/tree/main/apps/api/src/agent" target="_blank" rel="noreferrer" className={appNavLinkClassName}>
                Código do agente
              </a>
            }
          >
            Dados fictícios: o mercado e a loja são de teste e somem sozinhos em 24h.
          </AppFooter>
        </I18nProvider>
      </body>
    </html>
  );
}
