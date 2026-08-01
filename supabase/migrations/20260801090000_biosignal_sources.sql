-- AA2 MIGRATION — widen biosignal sources for the full stack.
-- The founder's stack: Beats Pro 2 · Oura Ring 4 · Garmin Tactix 8 · WHOOP,
-- plus Strava activity history. Idempotent.
ALTER TABLE public.biosignal_readings
  DROP CONSTRAINT IF EXISTS biosignal_readings_source_check;
ALTER TABLE public.biosignal_readings
  ADD CONSTRAINT biosignal_readings_source_check
  CHECK (source IN ('oura', 'garmin', 'strava', 'whoop', 'beats', 'manual'));
