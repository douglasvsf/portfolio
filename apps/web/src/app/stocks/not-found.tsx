import Link from "next/link";
import { getStocksDictionary } from "@/content/stocks";
import { getRequestLocale } from "@/i18n/request";

export default async function NotFound() {
  const { states } = getStocksDictionary(await getRequestLocale());
  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <h1 className="font-mono text-h1 font-bold text-primary">404</h1>
      <p className="text-muted-foreground">{states.notFound}</p>
      <Link href="/stocks" className="text-primary underline-offset-4 hover:underline">
        {states.backToMarket}
      </Link>
    </div>
  );
}
