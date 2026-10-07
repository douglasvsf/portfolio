/**
 * Esquema do GODZILLA Pay em SQL puro, aplicado em ordem e uma vez só (tabela
 * pay_migrations). As regras de dinheiro moram no banco, não só no código:
 *
 * - CHECKs impedem estornar mais do que foi pago e cobrança paga sem data;
 * - o livro-caixa é de partidas dobradas: um trigger de restrição ADIADO
 *   confere, no COMMIT, que cada transação tem débitos = créditos;
 * - lançamento não se altera nem se apaga (só some junto com a loja de teste
 *   inteira, quando ela expira).
 */
export const MIGRATIONS: { id: string; sql: string }[] = [
  {
    id: "001_inicial",
    sql: `
create table pay_merchants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  pix_key uuid not null default gen_random_uuid(),
  api_key_prefix text not null unique,
  api_key_hash text not null,
  webhook_secret text not null,
  webhook_url text,
  inspector_fail_next int not null default 0 check (inspector_fail_next between 0 and 5),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index pay_merchants_expires on pay_merchants (expires_at);

create table pay_charges (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references pay_merchants (id) on delete cascade,
  txid text not null unique,
  status text not null default 'pending' check (status in ('pending', 'paid', 'partially_refunded', 'refunded', 'expired')),
  amount bigint not null check (amount > 0),
  fee bigint not null default 0 check (fee >= 0 and fee < amount),
  refunded bigint not null default 0,
  description text,
  customer_name text,
  customer_document text,
  br_code text not null,
  expires_at timestamptz not null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  constraint pay_charges_refund_within_amount check (refunded >= 0 and refunded <= amount),
  constraint pay_charges_paid_has_date check ((status in ('pending', 'expired')) = (paid_at is null)),
  constraint pay_charges_refund_status check ((status = 'refunded') = (refunded = amount))
);
create index pay_charges_merchant on pay_charges (merchant_id, created_at desc);
create index pay_charges_pending on pay_charges (expires_at) where status = 'pending';

create table pay_ledger_transactions (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references pay_merchants (id) on delete cascade,
  charge_id uuid not null references pay_charges (id) on delete cascade,
  kind text not null check (kind in ('payment', 'refund')),
  created_at timestamptz not null default now()
);
create index pay_ledger_transactions_merchant on pay_ledger_transactions (merchant_id, created_at desc);

create table pay_ledger_entries (
  id bigserial primary key,
  transaction_id uuid not null references pay_ledger_transactions (id) on delete cascade,
  account text not null,
  direction text not null check (direction in ('debit', 'credit')),
  amount bigint not null check (amount > 0)
);
create index pay_ledger_entries_transaction on pay_ledger_entries (transaction_id);
create index pay_ledger_entries_account on pay_ledger_entries (account);

create function pay_check_balanced() returns trigger language plpgsql as $$
declare
  difference bigint;
begin
  select coalesce(sum(case direction when 'debit' then amount else -amount end), 0) into difference
  from pay_ledger_entries where transaction_id = new.transaction_id;
  if difference <> 0 then
    raise exception 'transação % do livro-caixa desbalanceada (diferença de % centavos)', new.transaction_id, difference
      using errcode = '23514';
  end if;
  return null;
end $$;

create constraint trigger pay_entries_balanced
  after insert on pay_ledger_entries
  deferrable initially deferred
  for each row execute function pay_check_balanced();

-- Apagar só em cascata (a loja de teste expirou); alterar, nunca.
create function pay_ledger_immutable() returns trigger language plpgsql as $$
begin
  if tg_op = 'DELETE' and pg_trigger_depth() > 1 then
    return old;
  end if;
  raise exception 'o livro-caixa é imutável: lançamentos não podem ser alterados nem apagados' using errcode = '42501';
end $$;

create trigger pay_entries_immutable before update or delete on pay_ledger_entries
  for each row execute function pay_ledger_immutable();
create trigger pay_transactions_immutable before update or delete on pay_ledger_transactions
  for each row execute function pay_ledger_immutable();

create table pay_idempotency_keys (
  merchant_id uuid not null references pay_merchants (id) on delete cascade,
  key text not null,
  request_hash text not null,
  status_code int not null,
  response jsonb not null,
  created_at timestamptz not null default now(),
  primary key (merchant_id, key)
);

create table pay_webhook_deliveries (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references pay_merchants (id) on delete cascade,
  event_id uuid not null unique,
  event_type text not null,
  charge_id uuid references pay_charges (id) on delete cascade,
  payload jsonb not null,
  url text,
  status text not null default 'pending' check (status in ('pending', 'delivered', 'failed')),
  attempts int not null default 0,
  next_attempt_at timestamptz default now(),
  last_status_code int,
  last_error text,
  delivered_at timestamptz,
  created_at timestamptz not null default now()
);
create index pay_deliveries_due on pay_webhook_deliveries (next_attempt_at) where status = 'pending';
create index pay_deliveries_merchant on pay_webhook_deliveries (merchant_id, created_at desc);

create table pay_webhook_attempts (
  id bigserial primary key,
  delivery_id uuid not null references pay_webhook_deliveries (id) on delete cascade,
  attempted_at timestamptz not null default now(),
  status_code int,
  error text,
  duration_ms int not null
);
create index pay_webhook_attempts_delivery on pay_webhook_attempts (delivery_id, attempted_at);

create table pay_inspector_requests (
  id bigserial primary key,
  merchant_id uuid not null references pay_merchants (id) on delete cascade,
  received_at timestamptz not null default now(),
  event_type text not null,
  headers jsonb not null,
  body text not null,
  signature_valid boolean not null,
  responded_status int not null
);
create index pay_inspector_merchant on pay_inspector_requests (merchant_id, received_at desc);
`,
  },
];
