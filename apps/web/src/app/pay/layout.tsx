import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { LogOut } from "@godzilla/icons";
import { AppBrand, AppFooter, AppHeader, I18nProvider, appContainerClassName, appNavLinkClassName, cn } from "@godzilla/ui";
import { BackToPortfolio } from "@/components/layout/back-to-portfolio";
import { PayNav } from "@/components/pay/pay-nav";
import { SITE_URL } from "@/config/site";
import { timeLeft } from "@/lib/erp/format";
import { leaveSandbox } from "@/lib/pay/actions";
import { currentPaySession } from "@/lib/pay/queries";
import "../globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: { default: "GODZILLA Pay — gateway Pix de demonstração", template: "%s · GODZILLA Pay" },
  description:
    "Gateway Pix de demonstração: cobranças com QR Code no padrão do Banco Central, livro-caixa de partidas dobradas, idempotência e webhooks assinados com novas tentativas. API em NestJS e PostgreSQL.",
};

/** O Pay é só em pt-BR, como o ERP, e usa o mesmo shell do Design System dos outros sistemas. */
export default async function PayLayout({ children }: LayoutProps<"/pay">) {
  const session = await currentPaySession();

  return (
    <html lang="pt-BR" className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <I18nProvider locale="pt-BR">
          <AppHeader
            skipToContent={{ label: "Pular para o conteúdo" }}
            brand={
              <AppBrand asChild>
                <Link href={session ? "/pay/cobrancas" : "/pay"}>
                  GODZILLA<span className="text-primary">/PAY</span>
                </Link>
              </AppBrand>
            }
            actions={<BackToPortfolio label="Voltar ao portfólio" />}
            below={
              session ? (
                <div className="border-t border-border">
                  <div className={cn(appContainerClassName, "flex flex-col gap-3 py-3 lg:flex-row lg:items-center lg:justify-between")}>
                    <PayNav className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none]" />
                    <div className="flex flex-wrap items-center gap-3 text-body-sm">
                      <span className="font-mono text-muted-foreground">
                        {session.name} · <span title={`Expira em ${new Date(session.expiresAt).toLocaleString("pt-BR")}`}>expira em {timeLeft(session.expiresAt)}</span>
                      </span>
                      <form action={leaveSandbox}>
                        <button
                          type="submit"
                          className="inline-flex items-center gap-1.5 rounded-sm font-mono text-caption text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-2 focus-visible:outline-primary"
                        >
                          <LogOut className="size-3.5" aria-hidden="true" />
                          Sair
                        </button>
                      </form>
                    </div>
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
              <a href="https://github.com/douglasvsf/portfolio/tree/main/apps/api/src/pay" target="_blank" rel="noreferrer" className={appNavLinkClassName}>
                Código da API
              </a>
            }
          >
            Ambiente de teste: nenhum dinheiro de verdade é movimentado. A loja some sozinha em 24h.
          </AppFooter>
        </I18nProvider>
      </body>
    </html>
  );
}
