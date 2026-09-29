import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { configureApp } from "./app.factory";
import { AppModule } from "./app.module";

/**
 * Entrada da API. Na Vercel, a detecção zero-config do NestJS procura aqui um
 * import direto de @nestjs/core — por isso o NestFactory fica neste arquivo.
 * Localmente, sobe na porta API_PORT (3001).
 */
async function bootstrap(): Promise<void> {
  const app = configureApp(await NestFactory.create<NestExpressApplication>(AppModule));
  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3001);
  await app.listen(port);
  console.log(`API rodando em http://localhost:${port} — documentação em /docs`);
}

bootstrap();
