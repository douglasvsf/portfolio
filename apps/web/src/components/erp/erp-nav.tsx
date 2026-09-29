"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { appNavLinkClassName, cn } from "@godzilla/ui";

const ITEMS = [
  { href: "/erp/dashboard", label: "Dashboard" },
  { href: "/erp/pdv", label: "PDV" },
  { href: "/erp/pedidos", label: "Pedidos" },
  { href: "/erp/produtos", label: "Produtos" },
  { href: "/erp/estoque", label: "Estoque" },
  { href: "/erp/clientes", label: "Clientes" },
];

/** Menu do ERP no mesmo estilo dos outros sistemas; no mobile rola na horizontal. */
export function ErpNav({ className, team, owner }: { className?: string; team?: boolean; owner?: boolean }) {
  const pathname = usePathname();
  const items = [...ITEMS, ...(team ? [{ href: "/erp/equipe", label: "Equipe" }] : []), ...(owner ? [{ href: "/erp/admin", label: "Painel" }] : [])];
  return (
    <nav aria-label="Menu do ERP" className={cn("flex gap-6 whitespace-nowrap font-mono text-body-sm text-muted-foreground", className)}>
      {items.map(({ href, label }) => {
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
