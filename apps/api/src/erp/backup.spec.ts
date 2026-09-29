import { MongoMemoryServer } from "mongodb-memory-server";
import { mongo, Types } from "mongoose";

// Script de linha de comando em CommonJS puro (roda no repositório de backup sem build).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const backup = require("../../scripts/erp-backup.cjs") as {
  createBackup: (db: mongo.Db, passphrase: string) => Promise<{ file: Buffer; summary: Record<string, number> }>;
  restoreBackup: (db: mongo.Db, file: Buffer, passphrase: string) => Promise<{ restored: Record<string, number> }>;
  encrypt: (plain: Buffer, passphrase: string) => Buffer;
  decrypt: (file: Buffer, passphrase: string) => Buffer;
};

jest.setTimeout(120_000);

const PASSPHRASE = "uma-frase-senha-longa-de-teste";

describe("backup do ERP", () => {
  let server: MongoMemoryServer;
  let client: mongo.MongoClient;

  beforeAll(async () => {
    server = await MongoMemoryServer.create();
    client = new mongo.MongoClient(server.getUri());
    await client.connect();
  });

  afterAll(async () => {
    await client?.close();
    await server?.stop();
  });

  it("criptografia: volta igual com a senha certa; senha errada ou arquivo alterado falham", () => {
    const file = backup.encrypt(Buffer.from("dados do mercado"), PASSPHRASE);
    expect(file.toString("utf8")).not.toContain("dados do mercado");
    expect(backup.decrypt(file, PASSPHRASE).toString()).toBe("dados do mercado");
    expect(() => backup.decrypt(file, "outra-frase-senha-qualquer")).toThrow("Senha errada ou arquivo corrompido");
    const tampered = Buffer.from(file);
    tampered[tampered.length - 1]! ^= 1;
    expect(() => backup.decrypt(tampered, PASSPHRASE)).toThrow();
    expect(() => backup.encrypt(Buffer.from("x"), "curta")).toThrow(/16 caracteres/);
  });

  it("só guarda dados de verdade e restaura com ObjectId e datas intactos", async () => {
    const source = client.db("origem");
    const real = new Types.ObjectId();
    const demo = new Types.ObjectId();
    const createdAt = new Date("2026-09-01T12:00:00Z");
    await source.collection("erp_workspaces").insertMany([
      { _id: real, name: "Mercado do Dono", kind: "real", createdAt },
      { _id: demo, name: "Demo", kind: "demo", expiresAt: new Date(Date.now() + 3_600_000) },
    ]);
    await source.collection("erp_products").insertMany([
      { workspaceId: real, sku: "REAL-1", priceCents: 500 },
      { workspaceId: demo, sku: "DEMO-1", priceCents: 500, expiresAt: new Date(Date.now() + 3_600_000) },
    ]);
    await source.collection("erp_users").insertOne({ workspaceId: real, email: "dono@exemplo.com.br", passwordHash: "scrypt$..." });

    const { file, summary } = await backup.createBackup(source, PASSPHRASE);
    expect(summary).toMatchObject({ erp_workspaces: 1, erp_products: 1, erp_users: 1, erp_orders: 0 });
    expect(file.includes(Buffer.from("REAL-1"))).toBe(false);

    const target = client.db("destino");
    await backup.restoreBackup(target, file, PASSPHRASE);
    const workspace = await target.collection("erp_workspaces").findOne({ _id: real });
    expect(workspace).toMatchObject({ name: "Mercado do Dono", createdAt });
    expect(await target.collection("erp_workspaces").countDocuments()).toBe(1);
    const product = await target.collection("erp_products").findOne({ sku: "REAL-1" });
    expect(product?.workspaceId).toEqual(real);

    // Restaurar de novo não duplica (upsert por _id).
    await backup.restoreBackup(target, file, PASSPHRASE);
    expect(await target.collection("erp_products").countDocuments()).toBe(1);
  });
});
