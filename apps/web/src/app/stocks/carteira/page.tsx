import type { Metadata } from "next";
import { PortfolioView } from "@/components/stocks/portfolio/portfolio-view";
import { getStocksDictionary } from "@/content/stocks";
import { getRequestLocale } from "@/i18n/request";

export async function generateMetadata(): Promise<Metadata> {
  const { portfolio } = getStocksDictionary(await getRequestLocale());
  return { title: portfolio.meta.title, description: portfolio.meta.description };
}

/** A carteira vive no navegador (localStorage): a página é só a casca. */
export default function PortfolioPage() {
  return <PortfolioView />;
}
