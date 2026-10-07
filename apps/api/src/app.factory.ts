import type { INestApplication } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { ErpExceptionFilter } from "./erp/common/errors";

/** Interface do Swagger pelo CDN (linha 5, a mesma do swagger-ui-dist usado pelo @nestjs/swagger). */
const SWAGGER_UI_CDN = "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5";

/**
 * Configuração da aplicação, compartilhada por main.ts (servidor/Vercel) e
 * pelos testes E2E — os testes exercitam exatamente a mesma configuração.
 */
export function configureApp(app: NestExpressApplication | INestApplication) {
  // Atrás do proxy da Vercel: req.ip vem do X-Forwarded-For.
  (app as NestExpressApplication).set?.("trust proxy", true);

  // Cabeçalhos de segurança (sem X-Powered-By, nosniff, HSTS, sem iframe) e uma CSP
  // que só libera o CDN da interface do Swagger — o resto da API responde JSON.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "https://cdn.jsdelivr.net"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
          imgSrc: ["'self'", "data:", "https://cdn.jsdelivr.net"],
          connectSrc: ["'self'"],
          frameAncestors: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
        },
      },
      crossOriginEmbedderPolicy: false,
    }),
  );

  const origins = (process.env.ERP_CORS_ORIGINS ?? "http://localhost:3000").split(",").map((origin) => origin.trim());
  app.enableCors({ origin: origins, methods: ["GET", "POST", "PATCH", "DELETE"] });
  app.useGlobalFilters(new ErpExceptionFilter());

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle("GODZILLA.DEV API")
      .setDescription(
        [
          "APIs dos sistemas do portfólio GODZILLA.DEV.",
          "**GODZILLA ERP** (MongoDB): comece em POST /erp/sessions/demo — ele cria uma empresa demo isolada (24h) e devolve o token; clique em Authorize e cole o token.",
          "**GODZILLA Pay** (PostgreSQL): comece em POST /pay/sandboxes — ele cria uma loja de teste (24h) e devolve a chave de API (gz_test_...); clique em Authorize e cole a chave. Criar cobrança e estornar exigem o cabeçalho Idempotency-Key.",
        ].join("\n\n"),
      )
      .setVersion("1.0")
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup("docs", app, document, {
    customSiteTitle: "GODZILLA.DEV API",
    swaggerOptions: { persistAuthorization: true },
    // Na Vercel a função não leva os arquivos do swagger-ui-dist (lidos do node_modules em
    // tempo de execução) e a página ficava em branco: a interface vem do CDN.
    customCssUrl: `${SWAGGER_UI_CDN}/swagger-ui.css`,
    customJs: [`${SWAGGER_UI_CDN}/swagger-ui-bundle.js`, `${SWAGGER_UI_CDN}/swagger-ui-standalone-preset.js`],
  });
  return app;
}

