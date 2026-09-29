import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from "@nestjs/common";
import { ThrottlerException } from "@nestjs/throttler";
import type { Response } from "express";
import type { erp } from "@portfolio/shared";

/**
 * Erro de negócio do ERP: código estável (para a tela decidir o que mostrar)
 * + mensagem em português + detalhes opcionais (ex.: itens sem estoque).
 */
export class ErpException extends HttpException {
  constructor(
    readonly code: erp.ErrorCode,
    message: string,
    status: HttpStatus,
    readonly details?: unknown,
  ) {
    super({ error: code, message, details } satisfies erp.ApiError, status);
  }
}

export const notFound = (what: string) => new ErpException("not_found", `${what} não encontrado`, HttpStatus.NOT_FOUND);
export const forbidden = () => new ErpException("forbidden", "Seu papel não tem permissão para esta ação", HttpStatus.FORBIDDEN);
export const invalidState = (message: string) => new ErpException("invalid_state", message, HttpStatus.CONFLICT);

const STATUS_CODES: Partial<Record<number, erp.ErrorCode>> = {
  400: "validation_error",
  401: "unauthorized",
  403: "forbidden",
  404: "not_found",
  409: "conflict",
  429: "rate_limited",
};

/**
 * Todo erro sai no mesmo formato `{ error, message, details? }`. Chave
 * duplicada do Mongo (código 11000) vira 409 "conflict"; erro inesperado vira
 * 500 genérico, sem vazar detalhes internos.
 */
@Catch()
export class ErpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("ErpExceptionFilter");

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const { status, body } = this.toApiError(exception);
    if (status >= 500) this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    response.status(status).json(body);
  }

  private toApiError(exception: unknown): { status: number; body: erp.ApiError } {
    if (exception instanceof ErpException) {
      return { status: exception.getStatus(), body: exception.getResponse() as erp.ApiError };
    }
    if (exception instanceof ThrottlerException) {
      return { status: 429, body: { error: "rate_limited", message: "Muitas requisições. Tente de novo em instantes." } };
    }
    if (isDuplicateKey(exception)) {
      const field = Object.keys(exception.keyPattern ?? {}).find((key) => key !== "workspaceId") ?? "registro";
      return { status: 409, body: { error: "conflict", message: `Já existe um cadastro com este ${FIELD_LABELS[field] ?? field}`, details: { field } } };
    }
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const response = exception.getResponse();
      const message = typeof response === "string" ? response : ((response as { message?: string }).message ?? exception.message);
      return { status, body: { error: STATUS_CODES[status] ?? "internal_error", message: String(message) } };
    }
    return { status: 500, body: { error: "internal_error", message: "Erro inesperado. Tente novamente." } };
  }
}

const FIELD_LABELS: Record<string, string> = { sku: "SKU", document: "CPF/CNPJ", barcode: "código de barras" };

function isDuplicateKey(error: unknown): error is { code: 11000; keyPattern?: Record<string, number> } {
  return typeof error === "object" && error !== null && (error as { code?: unknown }).code === 11000;
}
