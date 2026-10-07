import { MongoMemoryReplSet } from "mongodb-memory-server";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

/**
 * API para o E2E do site no CI: Mongo em memória (replica set, para as
 * transações do ERP funcionarem), PostgreSQL embutido (GODZILLA Pay) e a mesma entrada da API de produção (src/main.ts).
 * Nada de banco externo nem segredo real no pipeline.
 */
async function main() {
  const mongo = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
  // GODZILLA Pay: PostgreSQL embutido (o mesmo dos testes da API). import() nativo: o pacote é só ESM.
  const nativeImport = new Function("specifier", "return import(specifier)") as (specifier: string) => Promise<{ default: () => Promise<void>; teardown: () => Promise<void> }>;
  const postgres = await nativeImport(pathToFileURL(join(__dirname, "..", "test", "pg-setup.mjs")).href);
  await postgres.default();
  process.env.PAY_DATABASE_URL = process.env.PAY_TEST_DATABASE_URL;
  process.env.MONGODB_URI = mongo.getUri("godzilla-erp-e2e");
  process.env.ERP_BFF_KEY ??= "e2e-bff-key";
  process.env.ERP_SETUP_TOKEN ??= "e2e-setup-token-0123456789";
  process.env.API_PORT ??= "3001";

  const stop = async () => {
    await mongo.stop();
    await postgres.teardown();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  await import("../src/main");
}

void main();
