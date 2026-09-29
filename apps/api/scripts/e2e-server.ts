import { MongoMemoryReplSet } from "mongodb-memory-server";

/**
 * API do ERP para o E2E do site no CI: Mongo em memória (replica set, para as
 * transações funcionarem) e a mesma entrada da API de produção (src/main.ts).
 * Nada de banco externo nem segredo real no pipeline.
 */
async function main() {
  const mongo = await MongoMemoryReplSet.create({ replSet: { count: 1, storageEngine: "wiredTiger" } });
  process.env.MONGODB_URI = mongo.getUri("godzilla-erp-e2e");
  process.env.ERP_BFF_KEY ??= "e2e-bff-key";
  process.env.API_PORT ??= "3001";

  const stop = async () => {
    await mongo.stop();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);

  await import("../src/main");
}

void main();
