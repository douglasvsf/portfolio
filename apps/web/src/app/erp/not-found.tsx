import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <h1 className="font-mono text-h1 font-bold text-primary">404</h1>
      <p className="text-muted-foreground">Não encontramos isso na sua empresa demo.</p>
      <Link href="/erp/dashboard" className="text-primary underline-offset-4 hover:underline">
        Voltar ao dashboard
      </Link>
    </div>
  );
}
