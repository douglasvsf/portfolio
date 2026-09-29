import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NotFoundView } from "@/components/not-found/not-found-view";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "404 — GODZILLA.DEV",
  description: "Página não encontrada.",
  robots: { index: false },
};

/**
 * 404 de qualquer endereço que não existe. O site tem vários layouts raiz
 * ([lang], /stocks, /spotify, /erp), então não há um layout único para compor
 * a página: o Next entrega esta direto, sem passar por eles.
 */
export default function GlobalNotFound() {
  return (
    <html lang="pt-BR" className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <NotFoundView />
      </body>
    </html>
  );
}
