import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { erp } from "@portfolio/shared";
import { PrintButton } from "@/components/erp/print-button";
import { customerLabel, formatDateTime, money, quantity } from "@/lib/erp/format";
import { getOrder, requireSession } from "@/lib/erp/queries";

export async function generateMetadata({ params }: PageProps<"/erp/pdv/cupom/[id]">): Promise<Metadata> {
  const order = await getOrder((await params).id);
  return { title: order ? `Cupom #${order.number}` : "Cupom" };
}

/**
 * Cupom da venda no formato da bobina de 80 mm. Na impressão só o cupom
 * aparece (o resto da página some), e "salvar como PDF" gera o arquivo.
 */
export default async function ReceiptPage({ params }: PageProps<"/erp/pdv/cupom/[id]">) {
  const session = await requireSession();
  const order = await getOrder((await params).id);
  if (!order || order.channel !== "pos") notFound();

  return (
    <div className="flex flex-col items-center gap-6">
      <style>{`@media print {
        @page { size: 80mm auto; margin: 4mm; }
        body * { visibility: hidden; }
        #cupom, #cupom * { visibility: visible; }
        #cupom { position: absolute; inset: 0 auto auto 0; width: 72mm; box-shadow: none; border: 0; }
      }`}</style>
      <PrintButton />
      <article id="cupom" aria-label={`Cupom da venda ${order.number}`} className="w-[80mm] max-w-full bg-white p-4 font-mono text-[12px] leading-snug text-black shadow-lg">
        <header className="text-center">
          <p className="font-bold uppercase">{session.workspace.name}</p>
          <p>Loja de demonstração · GODZILLA ERP</p>
          <p className="mt-1 font-bold">CUPOM NÃO FISCAL</p>
        </header>
        <hr className="my-2 border-t border-dashed border-black" />
        <p>
          Venda #{order.number} · {formatDateTime(order.confirmedAt ?? order.createdAt)}
        </p>
        <p>Cliente: {customerLabel(order)}</p>
        {order.status === "cancelled" && <p className="font-bold">*** VENDA CANCELADA ***</p>}
        <hr className="my-2 border-t border-dashed border-black" />
        <ul>
          {order.items.map((item) => (
            <li key={item.productId} className="mb-1">
              <p>{item.name}</p>
              <p className="flex justify-between">
                <span>
                  {quantity(item.quantity, item.unit)} x {money(item.unitPriceCents)}
                </span>
                <span>{money(item.totalCents)}</span>
              </p>
            </li>
          ))}
        </ul>
        <hr className="my-2 border-t border-dashed border-black" />
        <dl>
          <Row label="Subtotal" value={money(order.subtotalCents)} />
          {order.discountCents > 0 && <Row label="Desconto" value={`- ${money(order.discountCents)}`} />}
          <Row label="TOTAL" value={money(order.totalCents)} strong />
          {order.payments?.map((payment, index) => <Row key={index} label={erp.PAYMENT_METHOD_LABELS[payment.method]} value={money(payment.amountCents)} />)}
          {!!order.changeCents && <Row label="Troco" value={money(order.changeCents)} />}
        </dl>
        <hr className="my-2 border-t border-dashed border-black" />
        <p className="text-center">Documento sem valor fiscal. Dados fictícios.</p>
      </article>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={strong ? "flex justify-between text-[14px] font-bold" : "flex justify-between"}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
