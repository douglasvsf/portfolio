import { HttpStatus, Injectable, Logger, type OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Pool, types, type PoolClient, type QueryResult, type QueryResultRow } from "pg";
import { ErpException } from "../erp/common/errors";
import { MIGRATIONS } from "./migrations";

/**
 * Conexão com o PostgreSQL do GODZILLA Pay. Preguiçosa: sem PAY_DATABASE_URL
 * (ou DATABASE_URL, que a integração Neon da Vercel cria sozinha), só as rotas
 * do Pay respondem 503 — o resto da API segue funcionando. As migrações rodam
 * na primeira conexão, sob um advisory lock (duas instâncias serverless
 * subindo juntas não aplicam a mesma migração duas vezes).
 */

/** bigint (centavos) chega como número: os valores ficam muito abaixo de 2^53. */
const parsers = {
  getTypeParser: ((oid: number, format?: "text" | "binary") =>
    oid === types.builtins.INT8 ? (value: string) => Number(value) : types.getTypeParser(oid, format as "text")) as typeof types.getTypeParser,
};

const MIGRATION_LOCK = 724_001;

/**
 * Onde procurar a URL (a primeira que existir). A integração Neon da Vercel
 * cria `<prefixo>_DATABASE_URL` — com o prefixo PAY_DATABASE, vira
 * PAY_DATABASE_DATABASE_URL. Todas são a URL com pooler.
 */
export const DATABASE_URL_VARIABLES = ["PAY_DATABASE_URL", "PAY_DATABASE_DATABASE_URL", "DATABASE_URL"] as const;

/** Pool, cliente de transação ou o próprio PayDatabase: qualquer coisa que execute SQL. */
export interface Queryable {
  query<Row extends QueryResultRow = QueryResultRow>(text: string, params?: unknown[]): Promise<QueryResult<Row>>;
}

export function databaseUrl(raw: string | undefined): string | undefined {
  const url = raw
    ?.trim()
    .replace(/^(PAY_)?DATABASE_URL=/, "")
    .replace(/^["']|["']$/g, "")
    .trim();
  if (!url) return undefined;
  if (!/^postgres(ql)?:\/\//.test(url)) throw new Error("PAY_DATABASE_URL inválida: o valor precisa começar com postgresql://. Confira a variável no projeto da Vercel.");
  return url;
}

@Injectable()
export class PayDatabase implements OnModuleDestroy {
  private readonly logger = new Logger("PayDatabase");
  private pool?: Pool;
  private ready?: Promise<void>;

  constructor(private readonly config: ConfigService) {}

  private async connect(): Promise<Pool> {
    const url = databaseUrl(DATABASE_URL_VARIABLES.map((name) => this.config.get<string>(name)).find(Boolean));
    if (!url) throw new ErpException("service_unavailable", "GODZILLA Pay indisponível: o banco de dados não está configurado.", HttpStatus.SERVICE_UNAVAILABLE);
    // Serverless: poucas conexões por instância (o pooler do Neon multiplica do lado de lá).
    this.pool ??= new Pool({ connectionString: url, max: 3, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 8000, types: parsers });
    this.ready ??= this.migrate(this.pool).catch((error: unknown) => {
      this.ready = undefined;
      throw error;
    });
    await this.ready;
    return this.pool;
  }

  private async migrate(pool: Pool) {
    const client = await pool.connect();
    try {
      await client.query("begin");
      await client.query("select pg_advisory_xact_lock($1)", [MIGRATION_LOCK]);
      await client.query("create table if not exists pay_migrations (id text primary key, applied_at timestamptz not null default now())");
      const { rows } = await client.query<{ id: string }>("select id from pay_migrations");
      const applied = new Set(rows.map((row) => row.id));
      for (const migration of MIGRATIONS.filter((item) => !applied.has(item.id))) {
        await client.query(migration.sql);
        await client.query("insert into pay_migrations (id) values ($1)", [migration.id]);
        this.logger.log(`migração aplicada: ${migration.id}`);
      }
      await client.query("commit");
    } catch (error) {
      await client.query("rollback").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  async query<Row extends QueryResultRow = QueryResultRow>(text: string, params: unknown[] = []) {
    return (await this.connect()).query<Row>(text, params);
  }

  /** Transação com rollback automático. O trigger adiado do livro-caixa confere o balanço no COMMIT. */
  async transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await (await this.connect()).connect();
    try {
      await client.query("begin");
      const result = await work(client);
      await client.query("commit");
      return result;
    } catch (error) {
      await client.query("rollback").catch(() => undefined);
      throw error;
    } finally {
      client.release();
    }
  }

  async onModuleDestroy() {
    await this.pool?.end();
  }
}
