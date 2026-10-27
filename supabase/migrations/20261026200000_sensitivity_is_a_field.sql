-- ─────────────────────────────────────────────────────────────────────────────
-- AA2 MIGRATION — SENSITIVITY IS A FIELD, NOT A GUESS
-- 2026-10-26 · companion to the Panel 02 wire
--
-- WHY THIS EXISTS.
--
-- Panel 02 leads with WHO the verdict is for — "Scanning for Lily · CHILD ·
-- 9YR · 2.0× SENSITIVITY" — because the same bottle is a different answer for
-- a nine-year-old. Canon states the multiplier as a first-class attribute, in
-- the Travel Dossier's own words: "Child sensitivity scaling is a first-class
-- attribute — a nine-year-old carries a 2.0× multiplier." Chemical Doctrine
-- Principle 4 says it as law: children, animals and stressed adults are not
-- mini adults, and sensitivity scales dynamically.
--
-- IT WAS A FIRST-CLASS ATTRIBUTE EVERYWHERE EXCEPT THE DATABASE. member_profiles
-- carries name and age and nothing else of this shape, so when the panel was
-- wired the screen had to DERIVE both the role and the multiplier from age —
-- under 18 is a CHILD, a CHILD gets 2.0×. That derivation is defensible and it
-- is still wrong in principle: a life-safety scaling factor computed in a
-- render function is a number nobody can audit, nobody can correct, and nobody
-- can disagree with. The membrane is where a member's truth lives.
--
-- WHAT THESE COLUMNS DO NOT DO. They do not invent a ladder. Canon gives one
-- figure — 2.0× for a child — and no curve between nine and adult. These
-- columns hold whatever the member declares and default to NULL, which the
-- app reads as "fall back to the documented derivation." The day the founder
-- rules on a finer ladder, the ladder writes here instead of into a screen.
--
-- DYNAMIC MEANS DYNAMIC. Principle 4 says sensitivity scales dynamically, and
-- a stressed adult is named in the same breath as a child. sensitivity_multiplier
-- is therefore NOT a children-only column — it is the scaling factor for this
-- member right now, whatever the reason, and the reason is its own column so
-- the number always travels with what caused it. NO NAKED NUMBERS.
--
-- Nullable. Idempotent. A blank is a truthful blank.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.member_profiles
  ADD COLUMN IF NOT EXISTS role                   text,
  ADD COLUMN IF NOT EXISTS sensitivity_multiplier numeric,
  ADD COLUMN IF NOT EXISTS sensitivity_reason     text;

-- A multiplier below 1 would quietly tell a member a thing is SAFER for them
-- than for a baseline adult. Nothing in canon scales down, and a scaling
-- factor is a life-safety value: it may raise caution, never lower it.
ALTER TABLE public.member_profiles
  DROP CONSTRAINT IF EXISTS member_profiles_sensitivity_multiplier_check;
ALTER TABLE public.member_profiles
  ADD CONSTRAINT member_profiles_sensitivity_multiplier_check
  CHECK (sensitivity_multiplier IS NULL
         OR (sensitivity_multiplier >= 1.0 AND sensitivity_multiplier <= 5.0));

ALTER TABLE public.member_profiles
  DROP CONSTRAINT IF EXISTS member_profiles_role_check;
ALTER TABLE public.member_profiles
  ADD CONSTRAINT member_profiles_role_check
  CHECK (role IS NULL OR role IN ('CHILD', 'ADULT', 'DEPENDENT', 'OPERATOR'));

COMMENT ON COLUMN public.member_profiles.role IS
  'CHILD · ADULT · DEPENDENT · OPERATOR. Drives the Panel 02 profile line. NULL means the app derives it from age.';
COMMENT ON COLUMN public.member_profiles.sensitivity_multiplier IS
  'Scaling factor applied to every verdict for this member. Canon receipt: a nine-year-old carries 2.0×. NULL means fall back to the documented derivation. Never below 1.0 — a multiplier may raise caution, never lower it.';
COMMENT ON COLUMN public.member_profiles.sensitivity_reason IS
  'Why this member scales. NO NAKED NUMBERS: the multiplier never travels without what caused it.';
