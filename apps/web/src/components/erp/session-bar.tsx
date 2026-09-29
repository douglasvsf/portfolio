import { LogOut } from "@godzilla/icons";
import { cn } from "@godzilla/ui";
import { erp } from "@portfolio/shared";
import { leaveDemo, switchRole } from "@/lib/erp/actions";
import { timeLeft } from "@/lib/erp/format";
import type { ErpSession } from "@/lib/erp/session";

/**
 * Empresa demo, tempo restante e troca de papel. Trocar para Vendedor mostra
 * na prática o controle de acesso: botões somem e a API recusa o que não pode.
 */
export function SessionBar({ session }: { session: ErpSession }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-body-sm">
      <span className="font-mono text-muted-foreground">
        {session.workspace.name} · <span title={`Expira em ${new Date(session.expiresAt).toLocaleString("pt-BR")}`}>expira em {timeLeft(session.expiresAt)}</span>
      </span>

      <form action={switchRole} className="flex items-center rounded-full border border-input p-0.5" aria-label="Papel na demonstração">
        {erp.ROLES.map((role) => {
          const active = session.role === role;
          return (
            <button
              key={role}
              type="submit"
              name="role"
              value={role}
              aria-pressed={active}
              disabled={active}
              className={cn(
                "rounded-full px-3 py-1 font-mono text-caption transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {erp.ROLE_LABELS[role]}
            </button>
          );
        })}
      </form>

      <form action={leaveDemo}>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-sm font-mono text-caption text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-2 focus-visible:outline-primary"
        >
          <LogOut className="size-3.5" aria-hidden="true" />
          Sair
        </button>
      </form>
    </div>
  );
}
