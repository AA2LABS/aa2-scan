-- AA2 MIGRATION — THE PIPE IS NOT THE SENSOR (founder interop finding 2026-08-12).
-- Verified live on the founder's own stack: WHOOP MG broadcasts standard BLE
-- heart rate, and Oura and Garmin both consume it simultaneously. One physical
-- heartbeat can therefore arrive through three pipes. `source` records the pipe
-- the reading arrived through; `origin_source` records the physical sensor that
-- actually measured it. The Clarifier weighs by origin, never by pipe — a
-- relayed reading must never vote twice.
-- Also admits 'muse' — the Crown is inbound. Idempotent.

ALTER TABLE public.biosignal_readings
  ADD COLUMN IF NOT EXISTS origin_source text;

ALTER TABLE public.biosignal_readings
  DROP CONSTRAINT IF EXISTS biosignal_readings_source_check;
ALTER TABLE public.biosignal_readings
  ADD CONSTRAINT biosignal_readings_source_check
  CHECK (source IN ('oura', 'garmin', 'strava', 'whoop', 'beats', 'muse', 'manual'));

ALTER TABLE public.biosignal_readings
  DROP CONSTRAINT IF EXISTS biosignal_readings_origin_source_check;
ALTER TABLE public.biosignal_readings
  ADD CONSTRAINT biosignal_readings_origin_source_check
  CHECK (origin_source IS NULL
         OR origin_source IN ('oura', 'garmin', 'strava', 'whoop', 'beats', 'muse', 'manual'));

COMMENT ON COLUMN public.biosignal_readings.origin_source IS
  'The physical sensor that produced this measurement, when known. NULL = assumed same as source. When broadcast mode relays one sensor through many pipes, rows sharing an origin_source are one vote, not several.';
