"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appNavLinkClassName, cn } from "@godzilla/ui";

const ITEMS = [
  { href: "/erp/dashboard", label: "Dashboard" },
  { href: "/erp/pedidos", label: "Pedidos" },
  { href: "/erp/produtos", label: "Produtos" },
  { href: "/erp/estoque", label: "Estoque" },
  { href: "/erp/clientes", label: "Clientes" },
];

/** Menu do ERP no mesmo estilo dos outros sistemas; no mobile rola na horizontal. */
export function ErpNav({ className }: { className?: string }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Menu do ERP" className={cn("flex gap-6 whitespace-nowrap font-mono text-body-sm text-muted-foreground", className)}>
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
