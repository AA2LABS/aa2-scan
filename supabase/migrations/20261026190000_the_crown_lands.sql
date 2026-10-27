-- ─────────────────────────────────────────────────────────────────────────────
-- AA2 MIGRATION — THE CROWN LANDS
-- 2026-10-26
--
-- FOUNDER ORDER: "my instruments need to be wired live and showing on the
-- dashboard."
--
-- WHY THIS MIGRATION EXISTS, AND IT IS THE SAME DISEASE TWICE.
--
-- Canon v70 Part IX names the Muse S Athena "the only instrument in the stack
-- that MEASURES instead of infers," and the Triangulation Doctrine names the
-- hole in Muse's own product: the Athena records EEG all session, renders the
-- traces on the post-session screen, and then NOTHING CONSUMES THEM. Per
-- Muse's own CTO, the brainwave data has no effect at this time.
--
-- AA2 has been carrying the identical hole. The top of lib/biosignals.ts has
-- said so since 2026-08-21, in writing:
--
--   "THE CROWN HAS HAD A SEAT SINCE 2026-08-14 AND NOTHING EVER SAT IN IT...
--    The same disease AA2 diagnosed in Muse — measured, stored, never wired —
--    was sitting inside AA2."
--
-- That note closed HALF the hole. Migration 20260814210000 widened the source
-- CHECK constraint to accept 'muse', and the room migration kept it. So the
-- membrane will ACCEPT a Muse reading today. But there has never been a single
-- column in biosignal_readings that can hold what the Crown actually reads.
-- Thirty-four columns of heart, sleep, skin and room — and not one band of
-- EEG. The Crown could be admitted through the door and then had nowhere to
-- sit down.
--
-- THE CONSEQUENCE ON THE SCREEN, verified 2026-10-26: app/(tabs)/biobuddy.tsx
-- carries a DEVICE_SOURCE map with six entries. muse_s_athena is not one of
-- them, so the Crown's row renders AWAITING SIGNAL forever and no pipe on
-- earth could change it. Four rows are in that state. This migration is the
-- first of them, because it is the instrument the doctrine is built on.
--
-- WHAT THESE COLUMNS ARE, AND IN WHOSE UNITS.
--
-- Mind Monitor is the witness, not the Muse app. Canon Part IX §9.9: "The Muse
-- app returns finished verdicts — calm percent, stillness, alpha peak, brain
-- recharge. That is vendor output, which AA2's doctrine bans as truth. Mind
-- Monitor returns the measurement." So these columns hold BAND POWER as Mind
-- Monitor emits it — absolute, logarithmic, one value per band, averaged
-- across the four scalp channels TP9 · AF7 · AF8 · TP10.
--
-- ⚠ WHAT IS DELIBERATELY NOT HERE, AND WHY EACH ONE IS ABSENT.
--
--   NO ALPHA PEAK FREQUENCY. The approved panel HTML shows the Crown's row as
--   "α 7.8Hz". Mind Monitor does not emit a peak frequency — it emits band
--   power. A peak in Hz cannot be derived from these columns without inventing
--   a method, and NEVER STATE A DEVICE CAPABILITY WITHOUT THE RECEIPT governs
--   a number on a screen exactly as it governs a spec sheet. The panel's
--   7.8Hz is wire content. It is not a measurement this schema can produce and
--   this migration does not pretend otherwise.
--
--   NO fNIRS / OPTICS COLUMN. The founder's own 2026-09-01 capture proved
--   Optics 1–7 carry live data and 8–16 are flat zero. But turning raw optode
--   counts into prefrontal oxygenation is a derivation with a literature
--   behind it, and AA2 does not own that derivation yet. A column that would
--   have to be filled by a guess is worse than no column. It waits for a
--   receipt.
--
--   NO FOCUS SCORE. Canon Part IX §9.10 is explicit, sourced to Muse's CTO:
--   "EEG and fNIRS are two separate channels on the same device. AA2 must
--   never merge them into a single 'focus score.'"
--
-- CONTACT QUALITY IS A FIRST-CLASS COLUMN, NOT A FOOTNOTE.
-- Canon v70 PART XXV LAW 23: "Contact quality joins placement and charge state
-- as a per-session field; an instrument that disagrees on a poor-contact night
-- loses weight for that night, not for good." Canon §9.9 says it plainer:
-- "Watch HSI before every session; bad contact makes the file useless
-- regardless of settings." A band of theta from a session where the sensors
-- were not touching skin is not a smaller measurement, it is not a
-- measurement. eeg_contact_good_pct is how the Clarifier will know which.
--
-- AND THE DENOMINATOR SHIPS WITH THE NUMBER. NO NAKED NUMBERS is canon law:
-- "every number ships with what it means." eeg_samples and eeg_session_sec are
-- that law expressed as schema — a band value can never be read without the
-- count of samples behind it and the length of the sit that produced it.
--
-- Every column is nullable. A blank is a truthful blank.
-- Idempotent — safe to run twice.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.biosignal_readings
  ADD COLUMN IF NOT EXISTS eeg_delta              numeric,
  ADD COLUMN IF NOT EXISTS eeg_theta              numeric,
  ADD COLUMN IF NOT EXISTS eeg_alpha              numeric,
  ADD COLUMN IF NOT EXISTS eeg_beta               numeric,
  ADD COLUMN IF NOT EXISTS eeg_gamma              numeric,
  ADD COLUMN IF NOT EXISTS eeg_contact_good_pct   numeric,
  ADD COLUMN IF NOT EXISTS eeg_samples            integer,
  ADD COLUMN IF NOT EXISTS eeg_session_sec        numeric;

COMMENT ON COLUMN public.biosignal_readings.eeg_delta IS
  'Mean absolute Delta band power across TP9/AF7/AF8/TP10, in Mind Monitor''s own units (Bels). Not a score. Not a vendor verdict.';
COMMENT ON COLUMN public.biosignal_readings.eeg_theta IS
  'Mean absolute Theta band power across the four scalp channels. Canon amendment 2026-09-19 §4.4: Mind Monitor work watches THETA.';
COMMENT ON COLUMN public.biosignal_readings.eeg_alpha IS
  'Mean absolute Alpha band power across the four scalp channels. Alpha power is INVERSELY related to activation — more alpha means less activity.';
COMMENT ON COLUMN public.biosignal_readings.eeg_beta IS
  'Mean absolute Beta band power across the four scalp channels.';
COMMENT ON COLUMN public.biosignal_readings.eeg_gamma IS
  'Mean absolute Gamma band power across the four scalp channels. Canon: gamma rises with active problem-solving.';
COMMENT ON COLUMN public.biosignal_readings.eeg_contact_good_pct IS
  'Percent of accepted samples where ALL FOUR channels reported good contact (Mind Monitor HSI = 1). LAW 23: contact quality is a per-session field. Below roughly 70 the bands are not a measurement.';
COMMENT ON COLUMN public.biosignal_readings.eeg_samples IS
  'How many samples the band means were built from, after discarding every sample with HeadBandOn = 0. The denominator. NO NAKED NUMBERS.';
COMMENT ON COLUMN public.biosignal_readings.eeg_session_sec IS
  'Length of the recording in seconds, from first accepted timestamp to last. A 40-second sit and a 40-minute sit are not the same evidence.';

-- The source constraint already admits 'muse' — widened 2026-08-14
-- (20260814210000_origin_source.sql) and kept 2026-08-22 (20260822120000_the_room.sql).
-- Re-asserted here so this file stands alone if it is ever the only one read.
ALTER TABLE public.biosignal_readings
  DROP CONSTRAINT IF EXISTS biosignal_readings_source_check;
ALTER TABLE public.biosignal_readings
  ADD CONSTRAINT biosignal_readings_source_check
  CHECK (source IN ('oura', 'garmin', 'strava', 'whoop', 'beats', 'muse', 'ozlo', 'manual'));
