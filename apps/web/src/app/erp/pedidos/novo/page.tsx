import type { Metadata } from "next";
import { OrderBuilder } from "@/components/erp/order-builder";
import { PageHeader } from "@/components/erp/ui";
import { allCustomers, allProducts, requireSession } from "@/lib/erp/queries";

export const metadata: Metadata = { title: "Novo pedido" };

export default async function NewOrderPage() {
  await requireSession();
  const [products, customers] = await Promise.all([allProducts(), allCustomers()]);
  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Novo pedido" description="Escolha o cliente e os produtos. O preço de cada item fica congelado no momento em que entra no pedido." />
      <OrderBuilder products={products} customers={customers} />
    </div>
  );
}
