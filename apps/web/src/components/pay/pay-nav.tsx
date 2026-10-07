"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appNavLinkClassName, cn } from "@godzilla/ui";

const ITEMS = [
  { href: "/pay/cobrancas", label: "Cobranças" },
  { href: "/pay/webhooks", label: "Webhooks" },
  { href: "/pay/integracao", label: "Integração" },
];

export function PayNav({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Menu do GODZILLA Pay" className={cn("flex gap-6 whitespace-nowrap font-mono text-body-sm text-muted-foreground", className)}>
      {ITEMS.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn(appNavLinkClassName, active && "text-primary")}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
