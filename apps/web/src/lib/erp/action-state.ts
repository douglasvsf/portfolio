import type { erp } from "@portfolio/shared";

/** Estado devolvido pelas server actions do ERP para os formulários (useActionState). */
export type ActionState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string>; shortages?: erp.StockShortage[] };

export const IDLE: ActionState = { status: "idle" };
