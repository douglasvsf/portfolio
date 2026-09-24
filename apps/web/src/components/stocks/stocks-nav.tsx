"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appNavLinkClassName, cn } from "@godzilla/ui";
import { useStocksDictionary } from "@/content/stocks";

/** Navegação do Kaiju Stocks, no mesmo estilo do menu do Spotify Stats. */
export function StocksNav({ className }: { className?: string }) {
  const pathname = usePathname();
  const { nav } = useStocksDictionary();

  const items = [
    // O detalhe de uma ação (/stocks/acao/…) pertence ao "Mercado".
    { href: "/stocks", label: nav.market, active: pathname === "/stocks" || pathname.startsWith("/stocks/acao") },
    { href: "/stocks/carteira", label: nav.portfolio, active: pathname.startsWith("/stocks/carteira") },
  ];

  return (
    <nav aria-label={nav.label} className={cn("flex gap-6 whitespace-nowrap font-mono text-body-sm text-muted-foreground xl:gap-8", className)}>
      {items.map(({ href, label, active }) => (
        <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn(appNavLinkClassName, active && "text-primary")}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
