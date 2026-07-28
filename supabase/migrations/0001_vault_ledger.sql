-- Save-confirmation nervous system tables.
-- Project: zvxdpfbvmxzhjhqrnllb. Idempotent. Run via Supabase SQL editor or CLI.

-- vault_ledger — scanner "AWARE DOLLARS" the member actually followed.
create table if not exists vault_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  member_id uuid, source text not null default 'scanner', scan_id uuid,
  product_name text, recommendation text, alternative_name text,
  amount_saved numeric(10,2) not null, currency text not null default 'USD',
  followed_at timestamptz not null default now(), scan_result jsonb,
  created_at timestamptz not null default now()
);

-- membrane_events — every membrane write across the app (clarifier, armed layers, etc.)
create table if not exists membrane_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  member_id uuid, event_type text not null, source_screen text,
  subject text, value jsonb, note text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table vault_ledger enable row level security;
alter table membrane_events enable row level security;
create policy "own ledger" on vault_ledger for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create policy "own events" on membrane_events for all using (auth.uid()=user_id) with check (auth.uid()=user_id);
create index if not exists vault_ledger_user_idx on vault_ledger(user_id, followed_at desc);
create index if not exists membrane_events_user_idx on membrane_events(user_id, occurred_at desc);
