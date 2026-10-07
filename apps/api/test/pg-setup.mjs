import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import EmbeddedPostgres from "embedded-postgres";

/**
 * PostgreSQL de verdade para os testes do GODZILLA Pay (binário embutido,
 * sem Docker nem banco externo). Sobe uma vez antes de todas as suítes; a URL
 * vai para as suítes por PAY_TEST_DATABASE_URL.
 */
export default async function setup() {
  const dir = mkdtempSync(join(tmpdir(), "godzilla-pay-pg-"));
  const port = 54_000 + Math.floor(Math.random() * 1000);
  const server = new EmbeddedPostgres({ databaseDir: dir, port, user: "postgres", password: "postgres", persistent: false, onLog: () => {}, onError: () => {} });
  await server.initialise();
  await server.start();
  await server.createDatabase("pay_test");
  process.env.PAY_TEST_DATABASE_URL = `postgres://postgres:postgres@127.0.0.1:${port}/pay_test`;
  globalThis.__PAY_PG__ = { server, dir };
}

export async function teardown() {
  const state = globalThis.__PAY_PG__;
  if (!state) return;
  await state.server.stop();
  rmSync(state.dir, { recursive: true, force: true });
}
