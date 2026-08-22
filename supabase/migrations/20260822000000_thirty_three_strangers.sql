-- ─── AA2 MIGRATION — THE THIRTY-THREE STRANGERS ────────────────────────────
-- FOUNDER, 2026-08-22: "You created it, so the mess is yours. Just fix it."
--
-- FINDING, from his own database:
--   auth.users .............. 33
--   members with ANY data .... 4
--   member profile   -> 11e4c052-e197-4816-859c-215d8a7e59f9
--   device wires     -> 2cc1883a-1dea-49d7-a0bd-b04179f12e23
--   180 readings     -> b9cb60b6-33d6-4903-81bc-c1cf96697406  (2026-08-02 03:17)
--
-- lib/supabase.ts was created with no options, so supabase-js defaulted its
-- session storage to localStorage — which does not exist in React Native. The
-- session died with the app, and signInAnonymously() minted a BRAND NEW member
-- on every launch. Thirty-three launches, thirty-three members.
--
-- He did not redo onboarding ten times. AA2 MET A DIFFERENT STRANGER TEN TIMES.
-- Every choice he ever made saved perfectly, to a person who never came back.
-- The Chef said "I don't know anything about you" because the Chef read the
-- profile of a member born four seconds earlier.
--
-- The bleeding is stopped in lib/supabase.ts. This reunites what it scattered.
-- NOTHING IS DELETED. Rows change hands and stop being orphans.
-- ───────────────────────────────────────────────────────────────────────────

create table if not exists public.legacy_orphans (
  uid uuid primary key,
  noted_at timestamptz not null default now()
);
alter table public.legacy_orphans enable row level security;

-- Frozen ONCE, on the day of the finding. Every member alive at that moment
-- was the founder wearing a different name. No future member can be added.
insert into public.legacy_orphans (uid)
select id from auth.users
on conflict (uid) do nothing;

create or replace function public.claim_legacy_records()
returns jsonb
language plpgsql
security definer
set search_path = public
as $fn$
declare
  me uuid := auth.uid();
  r record; n bigint; total bigint := 0; moved jsonb := '{}'::jsonb;
begin
  if me is null then
    return jsonb_build_object('ok', false, 'error', 'no session');
  end if;

  -- Never claim from yourself.
  delete from public.legacy_orphans where uid = me;

  if not exists (select 1 from public.legacy_orphans) then
    return jsonb_build_object('ok', true, 'rows', 0, 'note', 'nothing left to claim');
  end if;

  -- Every table in the schema that carries a member, not a hand-written list —
  -- so a table nobody remembered cannot be left behind holding his history.
  for r in
    select c.table_name, c.column_name
    from information_schema.columns c
    join information_schema.tables t
      on t.table_schema = c.table_schema and t.table_name = c.table_name
    where c.table_schema = 'public'
      and t.table_type = 'BASE TABLE'
      and c.table_name <> 'legacy_orphans'
      and c.column_name in ('member_id','user_id')
      and c.data_type = 'uuid'
  loop
    begin
      execute format(
        'update public.%I set %I = $1 where %I in (select uid from public.legacy_orphans)',
        r.table_name, r.column_name, r.column_name
      ) using me;
      get diagnostics n = row_count;
      if n > 0 then
        moved := moved || jsonb_build_object(r.table_name, n);
        total := total + n;
      end if;
    exception when others then
      -- A unique-constraint collision on one table must not sink the reunion.
      moved := moved || jsonb_build_object(r.table_name || ':skipped', sqlerrm);
    end;
  end loop;

  -- The strangers have handed everything over. Close the list for good.
  delete from public.legacy_orphans;

  return jsonb_build_object('ok', true, 'claimed_by', me, 'rows', total, 'detail', moved);
end $fn$;

grant execute on function public.claim_legacy_records() to authenticated;

comment on function public.claim_legacy_records() is
  'ONE-TIME REUNION, 2026-08-22. Re-points every row owned by a member listed in legacy_orphans onto the caller, then empties the list. Deletes no data. Cannot take from any member created after the list was frozen.';
