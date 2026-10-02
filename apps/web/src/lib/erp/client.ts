import "server-only";
import { headers } from "next/headers";
import type { erp } from "@portfolio/shared";
import { getSession } from "./session";

/**
 * Cliente da API do ERP, só no servidor (BFF). Manda o token da sessão, a
 * chave do BFF e o IP real do visitante (para o rate limit da API valer por
 * pessoa, não pelo servidor da Vercel). Erros viram `ErpApiError` com o
 * código estável da API.
 */

const TIMEOUT_MS = 12_000;

export class ErpApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: erp.ErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "ErpApiError";
  }
}

export function isApiError(error: unknown, code?: erp.ErrorCode): error is ErpApiError {
  return error instanceof ErpApiError && (!code || error.code === code);
}

function apiUrl(path: string) {
  const base = process.env.ERP_API_URL;
  if (!base) throw new ErpApiError(503, "internal_error", "ERP_API_URL não configurada");
  return new URL(path, base.endsWith("/") ? base : `${base}/`).toString();
}

async function clientIp() {
  const list = await headers();
  return list.get("x-forwarded-for")?.split(",")[0]?.trim() || list.get("x-real-ip") || undefined;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  /** Sem sessão (ex.: criar a demo). */
  anonymous?: boolean;
  /** Token explícito, no lugar da sessão do ERP (painel do site, que tem cookie próprio). */
  token?: string;
  /** Headers extras (ex.: Idempotency-Key da venda no PDV). */
  headers?: Record<string, string>;
}

export async function erpRequest<T>(path: string, { method = "GET", body, query, anonymous, token, headers: extraHeaders }: RequestOptions = {}): Promise<T> {
  const url = new URL(apiUrl(path.replace(/^\//, "")));
  for (const [key, value] of Object.entries(query ?? {})) if (value !== undefined && value !== "") url.searchParams.set(key, String(value));

  const session = anonymous || token ? null : await getSession();
  const bearer = token ?? session?.token;
  if (!anonymous && !bearer) throw new ErpApiError(401, "unauthorized", "Sessão ausente — entre na demonstração");

  const ip = await clientIp();
  let response: Response;
  try {
    response = await fetch(url, {
      method,
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        accept: "application/json",
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
        ...(bearer ? { authorization: `Bearer ${bearer}` } : {}),
        ...(process.env.ERP_BFF_KEY ? { "x-bff-key": process.env.ERP_BFF_KEY } : {}),
        ...(ip ? { "x-client-ip": ip } : {}),
        ...extraHeaders,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ErpApiError(503, "internal_error", "Não foi possível falar com a API do ERP. Tente de novo em instantes.");
  }

  if (response.status === 204) return undefined as T;
  const payload = (await response.json().catch(() => null)) as (T & Partial<erp.ApiError>) | null;
  if (!response.ok) {
    throw new ErpApiError(
      response.status,
      (payload?.error as erp.ErrorCode | undefined) ?? "internal_error",
      payload?.message ?? `A API respondeu ${response.status}`,
      payload?.details,
    );
  }
  return payload as T;
}
