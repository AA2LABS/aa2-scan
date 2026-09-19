-- ─────────────────────────────────────────────────────────────────────────────
-- AA2 MIGRATION — THE RETENTION LAYER
-- 2026-09-19. Spoke 17.
--
-- Nothing on the market measures whether learning STUCK. A task app knows you
-- studied ninety minutes. An instrument knows your state during those ninety
-- minutes. Neither knows what you still hold thirty days later. These two
-- tables close that gap.
--
-- THE LAW: NO NAKED NUMBERS. A recall check records HELD or DID NOT HOLD with
-- the prompt attached. It never stores a score, a grade or a percentage. Any
-- rate the member sees is computed at read time and shown beside its reason.
--
-- SERVE THE TABLE: nothing here ranks the member or marks them late. A check
-- that goes unanswered is UNANSWERED, never FAILED.
--
-- AA2 CARRIES THE PATH, NEVER THE PROVIDER'S MATERIAL. module_id points at a
-- module in lib/study-content.ts — a pointer to a book, not the book.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.study_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  path_slug    text not null,
  module_id    text not null,
  module_label text,
  started_at   timestamptz not null default now(),
  ended_at     timestamptz,
  minutes      integer,
  -- The member's own word for how the session went. Never a score.
  felt         text check (felt in ('locked','ordinary','scattered')),
  note         text,
  created_at   timestamptz not null default now()
);

comment on table public.study_sessions is
  'One block of study against one module. The unit of Spoke 17 — not a timer, a record.';
comment on column public.study_sessions.felt is
  'The member says how it went in their own terms: locked, ordinary, scattered. Never derived, never scored, never shown as a number.';

create table if not exists public.recall_checks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  session_id   uuid not null references public.study_sessions(id) on delete cascade,
  prompt       text not null,
  -- +1 / +3 / +7 / +30 days from the session. Scheduled at session end.
  interval_day integer not null,
  due_at       timestamptz not null,
  answered_at  timestamptz,
  -- NULL = unanswered. Never FAILED. An unanswered check is not a wrong answer.
  held         boolean,
  created_at   timestamptz not null default now()
);

comment on table public.recall_checks is
  'Did it stick? One tap, held or did not hold, with the prompt attached. NULL held = unanswered, which is never treated as failure.';

create index if not exists study_sessions_user_started_idx
  on public.study_sessions (user_id, started_at desc);
create index if not exists recall_checks_user_due_idx
  on public.recall_checks (user_id, due_at);
create index if not exists recall_checks_session_idx
  on public.recall_checks (session_id);

alter table public.study_sessions enable row level security;
alter table public.recall_checks  enable row level security;

create policy "own study sessions" on public.study_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own recall checks" on public.recall_checks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
