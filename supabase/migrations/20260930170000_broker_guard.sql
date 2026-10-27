-- ─────────────────────────────────────────────────────────────────────────────
-- AA2 MIGRATION — THE BROKER GUARD
-- 2026-09-30. Canon v70, Blocker 3, open item (2): "a per-member daily quota
-- inside claude-broker", carried out on the founder's word. Plus the HEKA
-- tripwires: invented marker phrases planted in the HEKA knowledge so a copy of
-- it can be recognised anywhere, and a log if someone tests one.
--
-- NOTHING HERE STORES A PROMPT, A RESPONSE OR HEALTH DATA. broker_usage keeps
-- a member id, a day, a lane and a count. heka_tripwire_hits keeps a member id,
-- a time and WHICH marker was typed, never the rest of the message.
-- SERVER ONLY: RLS on, no policies, anon and authenticated have no grants.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.broker_usage (
  member uuid not null,
  day    date not null default (now() at time zone 'utc')::date,
  lane   text not null,
  calls  integer not null default 0,
  primary key (member, day, lane)
);
comment on table public.broker_usage is 'Per-member daily call count for claude-broker, by lane. Counts only.';

create table if not exists public.heka_canaries (
  phrase text primary key,
  note   text
);
comment on table public.heka_canaries is 'Invented HEKA marker phrases. Stripped by the broker before Claude sees the material. Never shown to members.';

create table if not exists public.heka_tripwire_hits (
  id     bigint generated always as identity primary key,
  member uuid,
  phrase text not null,
  at     timestamptz not null default now()
);
comment on table public.heka_tripwire_hits is 'Someone typed a HEKA marker phrase into the Concierge. Marker and member only, never the message.';

alter table public.broker_usage       enable row level security;
alter table public.heka_canaries      enable row level security;
alter table public.heka_tripwire_hits enable row level security;
revoke all on public.broker_usage, public.heka_canaries, public.heka_tripwire_hits from anon, authenticated;
grant select, insert, update on public.broker_usage, public.heka_tripwire_hits to service_role;
grant select on public.heka_canaries to service_role;

-- One atomic step: count this call and return the new total for the day.
create or replace function public.broker_count(p_member uuid, p_lane text)
returns integer
language sql
security definer
set search_path = public
as $$
  insert into public.broker_usage (member, day, lane, calls)
  values (p_member, (now() at time zone 'utc')::date, p_lane, 1)
  on conflict (member, day, lane) do update set calls = public.broker_usage.calls + 1
  returning calls;
$$;
revoke all on function public.broker_count(uuid, text) from public, anon, authenticated;
grant execute on function public.broker_count(uuid, text) to service_role;
