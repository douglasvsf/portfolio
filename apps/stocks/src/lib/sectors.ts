/** A brapi devolve os setores em inglês (classificação da TradingView). */
const sectorLabels: Record<string, string> = {
  "Retail Trade": "Varejo",
  "Energy Minerals": "Petróleo e Gás",
  "Health Services": "Serviços de Saúde",
  Utilities: "Utilidades Públicas",
  Finance: "Financeiro",
  "Consumer Services": "Serviços ao Consumidor",
  "Consumer Non-Durables": "Consumo Não Cíclico",
  "Non-Energy Minerals": "Mineração e Siderurgia",
  "Commercial Services": "Serviços Comerciais",
  "Distribution Services": "Distribuição",
  Transportation: "Transporte",
  "Technology Services": "Tecnologia",
  "Process Industries": "Indústria de Processos",
  Communications: "Telecomunicações",
  "Producer Manufacturing": "Bens Industriais",
  Miscellaneous: "Diversos",
  "Electronic Technology": "Eletrônicos",
  "Industrial Services": "Serviços Industriais",
  "Health Technology": "Tecnologia em Saúde",
  "Consumer Durables": "Consumo Cíclico",
};

export function sectorLabel(sector: string | null | undefined) {
  if (!sector) return "Sem setor";
  return sectorLabels[sector] ?? sector;
}
