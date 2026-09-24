"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, LayoutDashboard, ListMusic, Mic2, type LucideIcon } from "@godzilla/icons";
import { cn } from "@godzilla/ui";
import { routes } from "@/config/spotify";

const items: { href: string; label: string; icon: LucideIcon }[] = [
  { href: routes.dashboard, label: "Overview", icon: LayoutDashboard },
  { href: routes.artists, label: "Top Artists", icon: Mic2 },
  { href: routes.tracks, label: "Top Tracks", icon: ListMusic },
  { href: routes.recentlyPlayed, label: "Recently Played", icon: History },
];

/** Navegação do dashboard — no mobile vira uma faixa rolável abaixo do header. */
export function NavLinks({ className }: { className?: string }) {
  const pathname = usePathname();
  const navRef = useRef<HTMLElement>(null);

  // No mobile a faixa rola na horizontal: garante que a aba ativa fique visível.
  useEffect(() => {
    navRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [pathname]);

  return (
    <nav ref={navRef} aria-label="Dashboard" className={cn("flex gap-1", className)}>
      {items.map(({ href, label, icon: Icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-body-sm font-medium text-muted-foreground transition-colors duration-(--duration-fast)",
              "hover:bg-accent hover:text-foreground",
              active && "bg-accent text-accent-foreground",
            )}
          >
            <Icon className="size-(--size-icon-sm)" aria-hidden="true" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
