import { applyDecorators, HttpStatus, type PipeTransform } from "@nestjs/common";
import { ApiBody, ApiQuery } from "@nestjs/swagger";
import type { SchemaObject } from "@nestjs/swagger/dist/interfaces/open-api-spec.interface";
import { z } from "zod";
import { ErpException } from "./errors";

/**
 * Validação com os mesmos schemas Zod que as telas usam (@portfolio/shared).
 * Erro de validação sai como 400 "validation_error" com a lista de campos.
 */
export class ZodPipe<Schema extends z.ZodType> implements PipeTransform<unknown, z.output<Schema>> {
  constructor(private readonly schema: Schema) {}

  transform(value: unknown): z.output<Schema> {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;
    const issues = result.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message }));
    throw new ErpException("validation_error", issues[0]?.message ?? "Dados inválidos", HttpStatus.BAD_REQUEST, { issues });
  }
}

/** JSON Schema gerado do próprio Zod — a documentação nunca diverge da validação. */
const toJsonSchema = (schema: z.ZodType) => z.toJSONSchema(schema, { io: "input", unrepresentable: "any" }) as SchemaObject;

export const ApiZodBody = (schema: z.ZodType) => ApiBody({ schema: toJsonSchema(schema) });

/** Um @ApiQuery por campo do schema de filtros/paginação. */
export function ApiZodQuery(schema: z.ZodObject) {
  const json = toJsonSchema(schema) as SchemaObject & { properties?: Record<string, SchemaObject> };
  return applyDecorators(
    ...Object.entries(json.properties ?? {}).map(([name, property]) => ApiQuery({ name, required: false, schema: property })),
  );
}
