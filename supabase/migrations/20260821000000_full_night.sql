-- AA2 MIGRATION — THE FULL NIGHT (founder order 2026-08-21).
--
-- FINDING: on the night of 2026-08-20 four instruments watched one body —
-- Muse S Athena, Oura Ring 4, WHOOP MG, Garmin tactix 8 — and returned four
-- verdicts: 71, 82, 83, 89. The three largest disagreements were DEEP SLEEP
-- (0:26 vs 1:37 vs 1:53), AWAKE TIME (0:34 vs 1:19), and BEDTIME (8:25 PM vs
-- 9:12 vs 9:31 vs 9:38 — seventy-three minutes of spread, against SEVEN
-- minutes of spread on wake time).
--
-- NONE OF THOSE THREE HAD A COLUMN. biosignal_readings held five numbers per
-- day — hrv_rmssd, sleep_score, readiness_score, activity_score, stress_level
-- — so the exact fields the stack disagreed about had nowhere to land, and the
-- membrane could not perform the comparison the founder performed by hand.
--
-- A score is a vendor's opinion. The night is the measurement. This migration
-- gives the night its columns. Every column nullable — no instrument reports
-- all of them, and a blank is a truthful blank. Idempotent.

-- ── THE WINDOW ──────────────────────────────────────────────────────────────
-- Bedtime is the hard problem in this category; wake time is nearly solved.
-- Storing both ends per source is what makes that visible instead of hidden
-- inside a total.
ALTER TABLE public.biosignal_readings
  ADD COLUMN IF NOT EXISTS bedtime_start      timestamptz,
  ADD COLUMN IF NOT EXISTS bedtime_end        timestamptz;

-- ── ARCHITECTURE ────────────────────────────────────────────────────────────
ALTER TABLE public.biosignal_readings
  ADD COLUMN IF NOT EXISTS total_sleep_min    integer,
  ADD COLUMN IF NOT EXISTS time_in_bed_min    integer,
  ADD COLUMN IF NOT EXISTS deep_min           integer,
  ADD COLUMN IF NOT EXISTS rem_min            integer,
  ADD COLUMN IF NOT EXISTS light_min          integer,
  ADD COLUMN IF NOT EXISTS awake_min          integer,
  ADD COLUMN IF NOT EXISTS efficiency_pct     numeric,
  ADD COLUMN IF NOT EXISTS latency_min        integer;

-- ── CARDIAC ─────────────────────────────────────────────────────────────────
ALTER TABLE public.biosignal_readings
  ADD COLUMN IF NOT EXISTS resting_hr         numeric,
  ADD COLUMN IF NOT EXISTS avg_hr             numeric,
  ADD COLUMN IF NOT EXISTS min_hr             numeric;

-- ── RESPIRATORY ─────────────────────────────────────────────────────────────
ALTER TABLE public.biosignal_readings
  ADD COLUMN IF NOT EXISTS spo2_avg           numeric,
  ADD COLUMN IF NOT EXISTS spo2_min           numeric,
  ADD COLUMN IF NOT EXISTS respiration_avg    numeric,
  ADD COLUMN IF NOT EXISTS breathing_index    numeric;

-- ── THERMAL ─────────────────────────────────────────────────────────────────
-- Garmin measured −0.4° below the founder's own baseline on the night he
-- reported the room was "cold as hell," before that number had been seen.
-- Skin temperature is the channel that corroborated a member's own words.
ALTER TABLE public.biosignal_readings
  ADD COLUMN IF NOT EXISTS skin_temp_delta    numeric;

-- ── MOVEMENT ────────────────────────────────────────────────────────────────
-- RESTLESS MOMENTS AND WAKE EVENTS ARE NOT THE SAME MEASUREMENT. Garmin logged
-- 30 restless moments and Muse 35 episodes — those agree. WHOOP logged 7 wake
-- events, a different construct: true awakenings, not movements. Kept apart so
-- the membrane never reports two answers to one question as a disagreement.
ALTER TABLE public.biosignal_readings
  ADD COLUMN IF NOT EXISTS restless_moments   integer,
  ADD COLUMN IF NOT EXISTS wake_events        integer;

-- ── FITNESS ─────────────────────────────────────────────────────────────────
-- VO2 Max carries its own provenance. Garmin gates it behind a qualifying GPS
-- effort and froze at 36 on 2026-03-27; WHOOP infers it passively and returned
-- 35 on 2026-08-21. One point apart, five months apart, one body. The estimate
-- flag is what keeps a tested value and a modeled value from being averaged.
ALTER TABLE public.biosignal_readings
  ADD COLUMN IF NOT EXISTS vo2max             numeric,
  ADD COLUMN IF NOT EXISTS vo2max_estimated   boolean;

-- ── COMMENTS — the WHY rides on the column, per WHY-FIRST DOCTRINE ──────────
COMMENT ON COLUMN public.biosignal_readings.bedtime_start IS
  'Sleep onset as THIS source judged it. Four instruments spread 73 minutes on 2026-08-20 while agreeing within 7 minutes on wake. Onset is the unsolved measurement; storing it per source is what makes the disagreement legible.';
COMMENT ON COLUMN public.biosignal_readings.deep_min IS
  'Slow-wave / N3 minutes as THIS source scored it. Never averaged across sources — Muse 26, Oura 97, WHOOP 113 on one night. The spread IS the finding.';
COMMENT ON COLUMN public.biosignal_readings.awake_min IS
  'Minutes scored awake inside the sleep window. Distinct from wake_events and from restless_moments.';
COMMENT ON COLUMN public.biosignal_readings.restless_moments IS
  'Movement events. NOT awakenings. Garmin and Muse agree here where WHOOP appears to disagree only because WHOOP counts wake_events instead.';
COMMENT ON COLUMN public.biosignal_readings.wake_events IS
  'Discrete awakenings. NOT movements. The member remains the ground truth — he reported "a couple."';
COMMENT ON COLUMN public.biosignal_readings.skin_temp_delta IS
  'Skin temperature deviation from the member''s OWN baseline, in degrees. Never a population comparison.';
COMMENT ON COLUMN public.biosignal_readings.vo2max_estimated IS
  'TRUE = modeled from passive physiology (WHOOP). FALSE = produced by a qualifying tested effort (Garmin). Never blend the two.';
