import "reflect-metadata";
import { createApp } from "./app.factory";

/**
 * Entrada da API. Na Vercel (detecção zero-config do NestJS) este arquivo vira
 * uma Vercel Function; localmente, sobe na porta API_PORT (3001).
 */
async function bootstrap(): Promise<void> {
  const app = await createApp();
  const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3001);
  await app.listen(port);
  console.log(`API rodando em http://localhost:${port} — documentação em /docs`);
}

bootstrap();
