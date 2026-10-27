-- ─────────────────────────────────────────────────────────────────────────────
-- AA2 MIGRATION — HEKA KNOWLEDGE
-- 2026-09-30. Founder order: "plug HEKA into AA2."
--
-- THE CONCIERGE is the only AA2 intelligence that speaks for HEKA
-- TRANCE-formations. This table holds the HEKA Knowledge Pack, split by
-- section, so the claude-broker can hand THE CONCIERGE the rules plus the
-- sections a question needs.
--
-- SERVER ONLY. The pack is the practice's methods, scripts and programs. It
-- never ships in the app bundle and no member session can read it. Row level
-- security is on with NO policies, and anon/authenticated lose every grant.
-- Only the service role (inside the broker) reads it.
--
-- SOURCE OF TRUTH: HEKA/_tools/make_knowledge_pack.py builds the pack from the
-- site; HEKA/_tools/heka_to_supabase.py writes heka_knowledge_load.sql.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.heka_knowledge (
  slug       text primary key,
  part       text not null,
  title      text not null,
  body       text not null,
  -- true = sent with every HEKA question (who speaks, how to speak, contact)
  always     boolean not null default false,
  updated_at timestamptz not null default now()
);

comment on table public.heka_knowledge is
  'HEKA Knowledge Pack by section. Read only by claude-broker (service role) for THE CONCIERGE. Never readable by members.';

alter table public.heka_knowledge enable row level security;
revoke all on public.heka_knowledge from anon, authenticated;
grant select on public.heka_knowledge to service_role;
