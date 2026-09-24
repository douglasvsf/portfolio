"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { appNavLinkClassName, cn } from "@godzilla/ui";
import { routes } from "@/config/spotify";
import { useSpotifyDictionary } from "@/content/spotify";

/** Navegação do dashboard no estilo do menu do portfólio — no mobile vira uma faixa rolável. */
export function NavLinks({ className }: { className?: string }) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);
  const { dict } = useSpotifyDictionary();

  const items = [
    { href: routes.dashboard, label: dict.nav.overview },
    { href: routes.artists, label: dict.nav.artists },
    { href: routes.tracks, label: dict.nav.tracks },
    { href: routes.recentlyPlayed, label: dict.nav.recent },
  ];

  // No mobile a faixa rola na horizontal: garante que a aba ativa fique visível.
  useEffect(() => {
    navRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [pathname]);

  return (
    <nav
      ref={navRef}
      aria-label={dict.nav.label}
      className={cn("flex gap-6 whitespace-nowrap font-mono text-body-sm text-muted-foreground xl:gap-8", className)}
    >
      {items.map(({ href, label }) => {
        const active = pathname === href;
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn(appNavLinkClassName, active && "text-primary")}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
