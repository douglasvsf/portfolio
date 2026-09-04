import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  const port = process.env.API_PORT ? Number(process.env.API_PORT) : 3001;
  await app.listen(port);

  console.log(`API rodando em http://localhost:${port}`);
}

bootstrap();
