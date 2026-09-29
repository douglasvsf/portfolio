import type { Metadata } from "next";
import { PosTerminal } from "@/components/erp/pos-terminal";
import { PageHeader } from "@/components/erp/ui";
import { allCustomers, allProducts, requireSession } from "@/lib/erp/queries";

export const metadata: Metadata = { title: "PDV — frente de caixa" };

export default async function PosPage() {
  await requireSession();
  const [products, customers] = await Promise.all([allProducts(), allCustomers()]);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Frente de caixa"
        description="Venda de balcão: a venda já nasce confirmada, baixa o estoque na hora e aceita Pix, cartão e dinheiro com troco."
      />
      <PosTerminal products={products} customers={customers} />
    </div>
  );
}
