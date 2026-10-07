import type { INestApplication } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { configureApp } from "../app.factory";
import { DATABASE_URL_VARIABLES, databaseUrl } from "./db";
import { PayModule } from "./pay.module";

/** Sem banco configurado, só o GODZILLA Pay fica indisponível — com resposta clara, sem derrubar a API. */
describe("GODZILLA Pay sem banco configurado", () => {
  let app: INestApplication;
  const saved = Object.fromEntries(DATABASE_URL_VARIABLES.map((name) => [name, process.env[name]]));

  beforeAll(async () => {
    for (const name of DATABASE_URL_VARIABLES) delete process.env[name];
    const moduleRef = await Test.createTestingModule({ imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), PayModule] }).compile();
    app = configureApp(moduleRef.createNestApplication({ logger: false }));
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    for (const [name, value] of Object.entries(saved)) if (value) process.env[name] = value;
  });

  it("responde 503 com código estável", async () => {
    const response = await request(app.getHttpServer()).post("/pay/sandboxes").expect(503);
    expect(response.body).toEqual({ error: "service_unavailable", message: expect.stringMatching(/banco de dados não está configurado/) });
  });

  it("aceita a URL colada com aspas ou com o nome da variável; recusa o que não é Postgres", () => {
    expect(databaseUrl(' "postgresql://u:p@host/db?sslmode=require" ')).toBe("postgresql://u:p@host/db?sslmode=require");
    expect(databaseUrl("DATABASE_URL=postgres://u:p@host/db")).toBe("postgres://u:p@host/db");
    expect(databaseUrl("  ")).toBeUndefined();
    expect(() => databaseUrl("mongodb+srv://u:p@host")).toThrow(/postgresql:\/\//);
  });
});
