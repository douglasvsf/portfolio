import { Types } from "mongoose";
import { erp } from "@portfolio/shared";

/**
 * Dados da demo: um mercado com produtos, clientes, 6 meses de pedidos e o
 * livro-razão do estoque coerente com eles. Função pura e determinística
 * (mesmo "sorteio" sempre), com datas relativas ao momento da criação.
 *
 * Regras garantidas (e testadas): saldo nunca negativo, saldo de cada
 * movimentação bate com a soma das anteriores, estoque final = último saldo,
 * CPF/CNPJ válidos, alguns produtos abaixo do mínimo para os alertas.
 */

type P = [sku: string, name: string, category: erp.ProductCategory, unit: erp.Unit, priceCents: number];

const PRODUCTS: P[] = [
  ["HRT-BAN", "Banana prata", "hortifruti", "kg", 699],
  ["HRT-MAC", "Maçã gala", "hortifruti", "kg", 1099],
  ["HRT-TOM", "Tomate italiano", "hortifruti", "kg", 899],
  ["HRT-BAT", "Batata inglesa", "hortifruti", "kg", 599],
  ["HRT-CEB", "Cebola", "hortifruti", "kg", 549],
  ["HRT-ALF", "Alface crespa", "hortifruti", "un", 399],
  ["HRT-CEN", "Cenoura", "hortifruti", "kg", 499],
  ["HRT-LIM", "Limão tahiti", "hortifruti", "kg", 649],
  ["MER-ARR5", "Arroz branco tipo 1 5 kg", "mercearia", "un", 2890],
  ["MER-FEI1", "Feijão carioca 1 kg", "mercearia", "un", 849],
  ["MER-ACU1", "Açúcar refinado 1 kg", "mercearia", "un", 499],
  ["MER-CAF5", "Café torrado e moído 500 g", "mercearia", "un", 1890],
  ["MER-OLE9", "Óleo de soja 900 ml", "mercearia", "un", 799],
  ["MER-MAC5", "Macarrão espaguete 500 g", "mercearia", "un", 459],
  ["MER-FAR1", "Farinha de trigo 1 kg", "mercearia", "un", 549],
  ["MER-MOL3", "Molho de tomate 340 g", "mercearia", "un", 329],
  ["BEB-AGU15", "Água mineral 1,5 L", "bebidas", "un", 299],
  ["BEB-REF2", "Refrigerante de cola 2 L", "bebidas", "un", 999],
  ["BEB-SUC1", "Suco de laranja integral 1 L", "bebidas", "un", 899],
  ["BEB-CER35", "Cerveja lata 350 ml", "bebidas", "un", 449],
  ["BEB-COC1", "Água de coco 1 L", "bebidas", "un", 899],
  ["LAT-LEI1", "Leite integral 1 L", "laticinios", "un", 549],
  ["LAT-MUC", "Queijo muçarela", "laticinios", "kg", 4990],
  ["LAT-MAN2", "Manteiga com sal 200 g", "laticinios", "un", 1290],
  ["LAT-IOG17", "Iogurte natural 170 g", "laticinios", "un", 349],
  ["LAT-REQ2", "Requeijão cremoso 200 g", "laticinios", "un", 899],
  ["PAD-FRA", "Pão francês", "padaria", "kg", 1599],
  ["PAD-FOR5", "Pão de forma 500 g", "padaria", "un", 899],
  ["PAD-BOL", "Bolo de fubá", "padaria", "un", 1490],
  ["CAR-FRA", "Peito de frango", "carnes", "kg", 1899],
  ["CAR-MOI", "Carne moída patinho", "carnes", "kg", 3499],
  ["CAR-LIN", "Linguiça toscana", "carnes", "kg", 2499],
  ["LIM-DET5", "Detergente líquido 500 ml", "limpeza", "un", 279],
  ["LIM-SAB1", "Sabão em pó 1 kg", "limpeza", "un", 1590],
  ["LIM-SAN2", "Água sanitária 2 L", "limpeza", "un", 699],
  ["LIM-DES1", "Desinfetante 1 L", "limpeza", "un", 999],
  ["HIG-PAP12", "Papel higiênico 12 rolos", "higiene", "un", 2190],
  ["HIG-SAB9", "Sabonete 90 g", "higiene", "un", 249],
  ["HIG-CRE9", "Creme dental 90 g", "higiene", "un", 499],
  ["HIG-SHA35", "Shampoo 350 ml", "higiene", "un", 1690],
];

/** [nome, tipo, cidade] — nomes fictícios; e-mails no domínio reservado exemplo.com.br. */
const CUSTOMERS: [name: string, kind: "cpf" | "cnpj", city: string][] = [
  ["Restaurante Sabor da Serra", "cnpj", "Campo Mourão"],
  ["Lanchonete do Zé", "cnpj", "Maringá"],
  ["Padaria Pão Nosso", "cnpj", "Curitiba"],
  ["Bar do Kaiju", "cnpj", "São Paulo"],
  ["Cantina Bella Nonna", "cnpj", "Campo Mourão"],
  ["Ana Souza", "cpf", "Maringá"],
  ["Bruno Lima", "cpf", "Curitiba"],
  ["Carla Mendes", "cpf", "Campo Mourão"],
  ["Diego Rocha", "cpf", "São Paulo"],
  ["Elisa Martins", "cpf", "Rio de Janeiro"],
  ["Felipe Araújo", "cpf", "Maringá"],
  ["Gabriela Nunes", "cpf", "Curitiba"],
];

const ORDER_COUNT = 48;
const HISTORY_DAYS = 180;
/** Produtos que terminam abaixo do estoque mínimo (índices em PRODUCTS). */
const LOW_STOCK = new Set([2, 11, 21, 30, 36]);

/** Gerador determinístico (mulberry32): a demo é sempre a mesma loja. */
function random(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const round3 = (value: number) => Math.round(value * 1000) / 1000;
const slug = (name: string) =>
  name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");

export function buildDemoData(workspaceId: Types.ObjectId, now: Date, expiresAt: Date) {
  const rand = random(20260928);
  const pick = <T>(list: readonly T[]) => list[Math.floor(rand() * list.length)] as T;
  const daysAgo = (days: number, hour = 9) => {
    const date = new Date(now.getTime() - days * 86_400_000);
    date.setUTCHours(hour + 3, Math.floor(rand() * 60), 0, 0); // horário comercial em Brasília
    return date;
  };
  const base = { workspaceId, expiresAt };

  const products = PRODUCTS.map(([sku, name, category, unit, priceCents]) => ({
    _id: new Types.ObjectId(),
    ...base,
    sku,
    name,
    category,
    unit,
    priceCents,
    costCents: Math.round((priceCents * (0.62 + rand() * 0.12)) / 10) * 10,
    minStock: unit === "kg" ? 5 + Math.floor(rand() * 11) : 10 + Math.floor(rand() * 21),
    stock: 0,
    active: true,
  }));

  const customers = CUSTOMERS.map(([name, kind, city], index) => {
    const digits = Array.from({ length: kind === "cpf" ? 9 : 8 }, () => Math.floor(rand() * 10)).join("");
    const document = kind === "cpf" ? erp.completeCpf(digits) : erp.completeCnpj(`${digits}0001`);
    return {
      _id: new Types.ObjectId(),
      ...base,
      name,
      document,
      email: `${slug(name)}@exemplo.com.br`,
      phone: `44999${String(index + 1).padStart(6, "0")}`,
      city,
    };
  });

  // ---- Pedidos, do mais antigo ao mais recente --------------------------------
  const orders = Array.from({ length: ORDER_COUNT }, (_, index) => {
    const age = Math.round(HISTORY_DAYS - ((index + rand() * 0.8) * HISTORY_DAYS) / ORDER_COUNT);
    const createdAt = daysAgo(Math.max(age, 0), 8 + Math.floor(rand() * 9));
    const customer = pick(customers);
    const itemCount = 2 + Math.floor(rand() * 5);
    const chosen = new Set<number>();
    while (chosen.size < itemCount) chosen.add(Math.floor(rand() * products.length));

    const items = [...chosen].map((productIndex) => {
      const product = products[productIndex]!;
      const quantity = product.unit === "kg" ? 0.5 + Math.floor(rand() * 18) * 0.25 : 1 + Math.floor(rand() * 12);
      return {
        productId: product._id,
        sku: product.sku,
        name: product.name,
        unit: product.unit,
        category: product.category,
        quantity,
        unitPriceCents: product.priceCents,
        totalCents: Math.round(product.priceCents * quantity),
      };
    });
    const subtotalCents = items.reduce((sum, item) => sum + item.totalCents, 0);
    const discountCents = rand() < 0.2 ? Math.round(subtotalCents * 0.05) : 0;

    // Os 3 mais recentes seguem em rascunho; ~1 em 10 foi cancelado depois de confirmado.
    const isDraft = index >= ORDER_COUNT - 3;
    const isCancelled = !isDraft && rand() < 0.1;
    const confirmedAt = isDraft ? undefined : new Date(createdAt.getTime() + 3_600_000 * (1 + Math.floor(rand() * 5)));
    const cancelledAt = isCancelled ? new Date(confirmedAt!.getTime() + 86_400_000 * (1 + Math.floor(rand() * 3))) : undefined;

    return {
      _id: new Types.ObjectId(),
      ...base,
      number: index + 1,
      customerId: customer._id,
      customerName: customer.name,
      items,
      subtotalCents,
      discountCents,
      totalCents: subtotalCents - discountCents,
      status: (isDraft ? "draft" : isCancelled ? "cancelled" : "confirmed") as erp.OrderStatus,
      createdByRole: (rand() < 0.7 ? "seller" : "admin") as erp.Role,
      createdAt,
      updatedAt: cancelledAt ?? confirmedAt ?? createdAt,
      ...(confirmedAt ? { confirmedAt } : {}),
      ...(cancelledAt ? { cancelledAt } : {}),
    };
  });

  // ---- Livro-razão: eventos de venda, depois as entradas que os sustentam ------
  type Event = { at: Date; productIndex: number; delta: number; type: erp.MovementType; reason: string; orderId?: Types.ObjectId; orderNumber?: number; role: erp.Role };
  const events: Event[] = [];
  // Vendas brutas: a devolução de um cancelamento só chega dias depois da venda —
  // até lá o estoque precisa aguentar a venda inteira.
  const grossSold = products.map(() => 0);

  for (const order of orders) {
    if (!order.confirmedAt) continue;
    for (const item of order.items) {
      const productIndex = products.findIndex((product) => product._id.equals(item.productId));
      const meta = { productIndex, orderId: order._id, orderNumber: order.number, role: order.createdByRole };
      events.push({ ...meta, at: order.confirmedAt, delta: -item.quantity, type: "sale", reason: `Venda — pedido #${order.number}` });
      grossSold[productIndex] = round3(grossSold[productIndex]! + item.quantity);
      if (order.cancelledAt) {
        events.push({ ...meta, at: order.cancelledAt, delta: item.quantity, type: "sale_cancel", reason: `Cancelamento — pedido #${order.number}` });
      }
    }
  }

  // Duas compras por produto: a primeira cobre todas as vendas (brutas) até a reposição, a segunda
  // completa o necessário para o saldo final desejado. Assim o saldo nunca fica negativo: até a
  // reposição, primeira compra ≥ vendas do período; depois, total comprado ≥ vendas brutas + saldo alvo.
  const restockAt = daysAgo(HISTORY_DAYS / 2, 7);
  const grossBeforeRestock = products.map((_, productIndex) =>
    round3(events.filter((event) => event.productIndex === productIndex && event.type === "sale" && event.at < restockAt).reduce((sum, event) => sum - event.delta, 0)),
  );
  products.forEach((product, productIndex) => {
    // Produto vendido por unidade tem saldo inteiro; por kg, múltiplo de 0,25.
    const target = LOW_STOCK.has(productIndex)
      ? product.unit === "un"
        ? Math.floor(product.minStock * 0.4)
        : Math.floor(product.minStock * 0.4 * 4) / 4
      : round3(product.minStock * 2 + (product.unit === "kg" ? Math.round(rand() * 20) : Math.floor(rand() * 40)));
    const needed = round3(grossSold[productIndex]! + target);
    const buffer = product.unit === "kg" ? 2 : 5;
    const first = product.unit === "kg" ? Math.ceil((grossBeforeRestock[productIndex]! + buffer) * 4) / 4 : Math.ceil(grossBeforeRestock[productIndex]! + buffer);
    events.push({ at: daysAgo(HISTORY_DAYS + 2, 7), productIndex, delta: first, type: "in", reason: "Compra — fornecedor", role: "admin" });
    const second = round3(needed - first);
    if (second > 0) events.push({ at: restockAt, productIndex, delta: second, type: "in", reason: "Reposição — fornecedor", role: "admin" });
  });

  events.sort((a, b) => a.at.getTime() - b.at.getTime() || b.delta - a.delta);

  const balance = products.map(() => 0);
  const movements = events.map((event) => {
    balance[event.productIndex] = round3(balance[event.productIndex]! + event.delta);
    const product = products[event.productIndex]!;
    return {
      _id: new Types.ObjectId(),
      ...base,
      productId: product._id,
      productName: product.name,
      type: event.type,
      delta: event.delta,
      balanceAfter: balance[event.productIndex]!,
      reason: event.reason,
      role: event.role,
      createdAt: event.at,
      ...(event.orderId ? { orderId: event.orderId, orderNumber: event.orderNumber } : {}),
    };
  });

  products.forEach((product, index) => {
    product.stock = balance[index]!;
  });

  return { products, customers, orders, movements, lastOrderNumber: ORDER_COUNT };
}
