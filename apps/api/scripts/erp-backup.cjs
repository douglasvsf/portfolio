#!/usr/bin/env node
/**
 * Backup do GODZILLA ERP: só os dados de verdade (as demos se apagam sozinhas
 * e ficam de fora), em EJSON (preserva ObjectId e datas), gzip e criptografia
 * AES-256-GCM com chave derivada de uma senha (scrypt). Sem a senha, o arquivo
 * não serve para nada — pode ficar num repositório sem expor dado de ninguém.
 *
 * Uso:
 *   MONGODB_URI=... BACKUP_PASSPHRASE=... node erp-backup.cjs backup <pasta>
 *   MONGODB_URI=<destino> BACKUP_PASSPHRASE=... node erp-backup.cjs restore <arquivo>
 *
 * A restauração faz upsert por _id: não apaga nada que já exista no destino.
 */
const { createCipheriv, createDecipheriv, randomBytes, scryptSync } = require("node:crypto");
const { mkdirSync, readFileSync, writeFileSync } = require("node:fs");
const { join } = require("node:path");
const { gunzipSync, gzipSync } = require("node:zlib");

// No repositório de backup o pacote é o `mongodb`; dentro do monorepo, o que vem com o mongoose.
let mongo;
try {
  mongo = require("mongodb");
} catch {
  mongo = require("mongoose").mongo;
}
const { EJSON } = mongo.BSON;

/** Dados de empresa: só o que não expira (a demo tem `expiresAt`, a empresa de verdade não). */
const TENANT_COLLECTIONS = ["erp_workspaces", "erp_products", "erp_customers", "erp_stock_movements", "erp_orders", "erp_counters"];
/** Contas e links: tudo (são poucos e todos importam). */
const ACCOUNT_COLLECTIONS = ["erp_users", "erp_invites", "erp_password_resets", "erp_access_requests"];

const MAGIC = Buffer.from("GZERP1");
const SCRYPT = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

function key(passphrase, salt) {
  if (!passphrase || passphrase.length < 16) throw new Error("BACKUP_PASSPHRASE precisa ter pelo menos 16 caracteres");
  return scryptSync(passphrase, salt, 32, SCRYPT);
}

/** [MAGIC][sal 16][iv 12][tag 16][dados cifrados] */
function encrypt(plain, passphrase) {
  const salt = randomBytes(16);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(passphrase, salt), iv);
  const data = Buffer.concat([cipher.update(plain), cipher.final()]);
  return Buffer.concat([MAGIC, salt, iv, cipher.getAuthTag(), data]);
}

function decrypt(file, passphrase) {
  if (!file.subarray(0, MAGIC.length).equals(MAGIC)) throw new Error("Arquivo não é um backup do GODZILLA ERP");
  let offset = MAGIC.length;
  const take = (size) => file.subarray(offset, (offset += size));
  const salt = take(16);
  const iv = take(12);
  const tag = take(16);
  const decipher = createDecipheriv("aes-256-gcm", key(passphrase, salt), iv);
  decipher.setAuthTag(tag);
  try {
    return Buffer.concat([decipher.update(file.subarray(offset)), decipher.final()]);
  } catch {
    throw new Error("Senha errada ou arquivo corrompido");
  }
}

/** Lê o banco e devolve o arquivo cifrado + um resumo (quantos documentos por coleção). */
async function createBackup(db, passphrase, now = new Date()) {
  const collections = {};
  for (const name of TENANT_COLLECTIONS) collections[name] = await db.collection(name).find({ expiresAt: { $exists: false } }).toArray();
  for (const name of ACCOUNT_COLLECTIONS) collections[name] = await db.collection(name).find({}).toArray();

  const payload = EJSON.stringify({ version: 1, createdAt: now, database: db.databaseName, collections }, { relaxed: false });
  const summary = Object.fromEntries(Object.entries(collections).map(([name, docs]) => [name, docs.length]));
  return { file: encrypt(gzipSync(Buffer.from(payload)), passphrase), summary };
}

function readBackup(file, passphrase) {
  return EJSON.parse(gunzipSync(decrypt(file, passphrase)).toString("utf8"), { relaxed: false });
}

/** Upsert por _id em cada coleção. Devolve quantos documentos foram gravados. */
async function restoreBackup(db, file, passphrase) {
  const backup = readBackup(file, passphrase);
  const restored = {};
  for (const [name, docs] of Object.entries(backup.collections)) {
    if (docs.length) await db.collection(name).bulkWrite(docs.map((doc) => ({ replaceOne: { filter: { _id: doc._id }, replacement: doc, upsert: true } })));
    restored[name] = docs.length;
  }
  return { createdAt: backup.createdAt, restored };
}

async function main() {
  const [command, target] = process.argv.slice(2);
  const uri = process.env.MONGODB_URI;
  const passphrase = process.env.BACKUP_PASSPHRASE;
  if (!uri || !passphrase || !["backup", "restore"].includes(command) || !target) {
    console.error("Uso: MONGODB_URI=... BACKUP_PASSPHRASE=... node erp-backup.cjs backup <pasta> | restore <arquivo>");
    process.exit(2);
  }
  const client = new mongo.MongoClient(uri.trim().replace(/^["']|["']$/g, ""), { serverSelectionTimeoutMS: 15_000 });
  await client.connect();
  try {
    const db = client.db(process.env.MONGODB_DB || undefined);
    if (command === "backup") {
      const now = new Date();
      const { file, summary } = await createBackup(db, passphrase, now);
      mkdirSync(target, { recursive: true });
      const path = join(target, `erp-${now.toISOString().slice(0, 10)}.bak`);
      writeFileSync(path, file);
      console.log(`Backup gravado em ${path} (${(file.length / 1024).toFixed(1)} KB)`);
      console.table(summary);
    } else {
      const { createdAt, restored } = await restoreBackup(db, readFileSync(target), passphrase);
      console.log(`Backup de ${createdAt.toISOString()} restaurado em ${db.databaseName}`);
      console.table(restored);
    }
  } finally {
    await client.close();
  }
}

module.exports = { createBackup, restoreBackup, readBackup, encrypt, decrypt, TENANT_COLLECTIONS, ACCOUNT_COLLECTIONS };

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
