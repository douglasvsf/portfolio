import type { INestApplication } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { ErpExceptionFilter } from "./erp/common/errors";

/**
 * Configuração da aplicação, compartilhada por main.ts (servidor/Vercel) e
 * pelos testes E2E — os testes exercitam exatamente a mesma configuração.
 */
export function configureApp(app: NestExpressApplication | INestApplication) {
  // Atrás do proxy da Vercel: req.ip vem do X-Forwarded-For.
  (app as NestExpressApplication).set?.("trust proxy", true);

  const origins = (process.env.ERP_CORS_ORIGINS ?? "http://localhost:3000").split(",").map((origin) => origin.trim());
  app.enableCors({ origin: origins, methods: ["GET", "POST", "PATCH", "DELETE"] });
  app.useGlobalFilters(new ErpExceptionFilter());

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle("GODZILLA ERP API")
      .setDescription(
        "API do mini-ERP do portfólio GODZILLA.DEV. Comece em POST /erp/sessions/demo: ele cria uma empresa demo isolada (24h) e devolve o token — clique em Authorize e cole o token para testar as demais rotas.",
      )
      .setVersion("1.0")
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup("docs", app, document, { customSiteTitle: "GODZILLA ERP API", swaggerOptions: { persistAuthorization: true } });
  return app;
}

