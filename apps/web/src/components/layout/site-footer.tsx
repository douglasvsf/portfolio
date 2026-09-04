import { ApiStatus } from "@/components/ui/api-status";

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 font-mono text-xs text-muted-2 sm:flex-row">
        <p>© {new Date().getFullYear()} Godzilla. Todos os direitos reservados.</p>
        <ApiStatus />
      </div>
    </footer>
  );
}
