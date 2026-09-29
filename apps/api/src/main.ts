import "reflect-metadata";
import type { IncomingMessage, ServerResponse } from "node:http";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { configureApp } from "./app.factory";
import { AppModule } from "./app.module";

/**
 * Entrada da API.
 *
 * - Na Vercel (NestJS zero-config), este módulo exporta um handler: o Nest é
 *   inicializado uma vez por instância e reaproveitado entre requisições.
 *   (A detecção da Vercel procura aqui um import direto de @nestjs/core.)
 * - Localmente, sobe um servidor na porta API_PORT (3001).
 */
type RequestHandler = (request: IncomingMessage, response: ServerResponse) => void;

let handler: Promise<RequestHandler> | undefined;

async function createHandler(): Promise<RequestHandler> {
  const app = configureApp(await NestFactory.create<NestExpressApplication>(AppModule)) as NestExpressApplication;
  await app.init();
  return app.getHttpAdapter().getInstance();
}

export default async function vercelHandler(request: IncomingMessage, response: ServerResponse) {
  // Se a inicialização falhar (ex.: banco fora do ar), a próxima requisição tenta de novo.
  handler ??= createHandler().catch((error: unknown) => {
    handler = undefined;
    throw error;
  });
  (await handler)(request, response);
}

async function listen(): Promise<void> {
  const app = configureApp(await NestFactory.create<NestExpressApplication>(AppModule));
  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3001);
  await app.listen(port);
  console.log(`API rodando em http://localhost:${port} — documentação em /docs`);
}

if (!process.env.VERCEL) void listen();
