-- ─────────────────────────────────────────────────────────────────────────────
-- AA2 MIGRATION — THE BASELINES LAND
-- Found 2026-08-22 during the all-code audit, by probing every writer in the
-- app against the live schema.
--
-- lib/biosignals.ts has written hrv_baseline_30d and readiness_baseline_30d to
-- member_profiles after every Oura sync since 2026-08-01. THE COLUMNS NEVER
-- EXISTED. And the failure was invisible twice over: supabase-js returns its
-- error in the result instead of throwing, so the try/catch around the write
-- caught nothing, and the comment beside it said "non-fatal if columns absent."
-- Non-fatal, yes. Non-functional, also yes. The member's 30-day baselines have
-- silently landed nowhere the entire time.
--
-- These are the member's OWN numbers over his own window — THE REGIME LAW
-- applies to how they are read, and A VENDOR SCORE IS A POPULATION'S OPINION
-- OF YOU; A BASELINE IS YOU.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.member_profiles
  ADD COLUMN IF NOT EXISTS hrv_baseline_30d        numeric,
  ADD COLUMN IF NOT EXISTS readiness_baseline_30d  numeric;

COMMENT ON COLUMN public.member_profiles.hrv_baseline_30d IS
  'Median HRV over the member''s own trailing 30 days. His number, his window — never a population''s.';
COMMENT ON COLUMN public.member_profiles.readiness_baseline_30d IS
  'Median readiness over the member''s own trailing 30 days.';
