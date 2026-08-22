-- ─────────────────────────────────────────────────────────────────────────────
-- AA2 MIGRATION — THE ROOM
-- Founder order 2026-08-22: "you get the ozlo wired right so the temp can be
-- shown that it comes up with."
--
-- WHY THIS IS ITS OWN THING AND NOT ANOTHER BODY CHANNEL.
--
-- Every column in biosignal_readings up to now measures THE MEMBER — his heart,
-- his sleep, his skin. These three measure THE PLACE HE SLEPT. That is a
-- different question and it must not be averaged into a body baseline.
--
-- The founder's own design, 2026-08-22:
--   "the biggest difference is that i will know room temp and my temp even if i
--    wear the manta i use the OZLO to still read the room"
--   "they can still be worn underneath the manta ... i have multiple
--    configurations to choose from"
--
-- That makes the Ozlo case a MASK-AGNOSTIC ENVIRONMENT INSTRUMENT. It reads the
-- room whatever is on his face, so the room is measured in every configuration
-- rather than only in the ones that happen to include a particular product.
--
-- WHY IT MATTERS TO THE ONE OPEN QUESTION IN THE STACK. He predicted, in
-- advance and with a mechanism, that the Ozlo mask would produce a cooler night
-- than the Manta. GARMIN skin_temp_delta is already a delta from his OWN
-- baseline. Room temperature is the only thing that can tell those apart:
--
--   skin temp moves + room temp holds  -> the MASK did it
--   skin temp moves + room temp moves  -> the ROOM did it
--
-- NEITHER CHANNEL CAN SEPARATE THOSE ALONE. Both together can. That is the
-- entire reason this table gets three more columns.
--
-- ⚠ WHAT IS NOT CLAIMED HERE. No Ozlo export path has been verified. The device
-- ships 2026-08-24 and no manual has been read. These columns are the CHANNEL,
-- not a pipe: they accept a reading whether it arrives by hand or by an API
-- that may or may not exist. NEVER STATE A DEVICE CAPABILITY WITHOUT THE
-- RECEIPT — so the receipt is left blank until there is one.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.biosignal_readings
  ADD COLUMN IF NOT EXISTS room_temp_c    numeric,
  ADD COLUMN IF NOT EXISTS room_light     numeric,
  ADD COLUMN IF NOT EXISTS room_noise_db  numeric;

COMMENT ON COLUMN public.biosignal_readings.room_temp_c IS
  'Temperature of the ROOM the member slept in, degrees Celsius, ABSOLUTE — not a delta. This is the environment, never the member. Never averaged into a body baseline.';
COMMENT ON COLUMN public.biosignal_readings.room_light IS
  'Ambient light in the room. Environment channel. Absolute reading, units as reported by the instrument.';
COMMENT ON COLUMN public.biosignal_readings.room_noise_db IS
  'Ambient noise in the room, decibels. Environment channel.';

-- 'ozlo' joins the stack. It is admitted as both a PIPE and an ORIGIN because
-- the case both carries and measures — unlike a broadcast relay, nothing else
-- produced these numbers.
ALTER TABLE public.biosignal_readings
  DROP CONSTRAINT IF EXISTS biosignal_readings_source_check;
ALTER TABLE public.biosignal_readings
  ADD CONSTRAINT biosignal_readings_source_check
  CHECK (source IN ('oura', 'garmin', 'strava', 'whoop', 'beats', 'muse', 'ozlo', 'manual'));

ALTER TABLE public.biosignal_readings
  DROP CONSTRAINT IF EXISTS biosignal_readings_origin_source_check;
ALTER TABLE public.biosignal_readings
  ADD CONSTRAINT biosignal_readings_origin_source_check
  CHECK (origin_source IS NULL
         OR origin_source IN ('oura', 'garmin', 'strava', 'whoop', 'beats', 'muse', 'ozlo', 'manual'));
