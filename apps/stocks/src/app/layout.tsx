import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import { I18nProvider } from "@godzilla/ui";
import { TrendingUp } from "@godzilla/icons";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Kaiju Stocks — cotações da B3", template: "%s · Kaiju Stocks" },
  description: "Consulte ações da B3, maiores altas e quedas, volume por setor e histórico de preços.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-grid">
        <I18nProvider locale="pt-BR">
          <header className="sticky top-0 z-(--z-sticky) border-b border-border bg-background/85 backdrop-blur">
            <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4">
              <Link href="/" className="flex items-center gap-2 font-mono text-body-sm font-semibold">
                <TrendingUp className="size-(--size-icon-md) text-primary" aria-hidden="true" />
                <span>
                  kaiju<span className="text-primary">/stocks</span>
                </span>
              </Link>
              <span className="text-caption text-muted-foreground">
                Dados: <a href="https://brapi.dev" className="underline-offset-4 hover:text-foreground hover:underline">brapi.dev</a>
              </span>
            </div>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">{children}</main>
          <footer className="border-t border-border py-6 text-center text-caption text-muted-foreground">
            Cotações com atraso de até 15 minutos. Não é recomendação de investimento.
          </footer>
        </I18nProvider>
      </body>
    </html>
  );
}
