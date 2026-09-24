import type { StocksDictionary } from "@/content/stocks";

/** A brapi envia os setores em inglês (classificação da TradingView); o dicionário traduz. */
export function sectorLabel(sector: string | null | undefined, dict: StocksDictionary) {
  if (!sector) return dict.noSector;
  return dict.sectors[sector] ?? sector;
}
