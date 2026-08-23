-- ─────────────────────────────────────────────────────────────────────────────
-- AA2 MIGRATION — THE FOURTH CHANNEL
-- 2026-08-22. The Ozlo Smart Case has a barometer. The 08-21 correction that
-- said otherwise was ruled from ONE document — the user guide — which also
-- omits the light sensor everyone can watch working. The vendor's own product
-- page: "the Ozlo Smart Charging Case uses sensors to track sound, light,
-- temperature, and barometric pressure." Corroborated by reviewers scrolling
-- the app's pressure graph on camera. One document is not the receipt.
--
-- Pressure is the one channel no body-worn instrument can see: weather fronts
-- crossing a night. Absolute, environmental, never averaged into a body.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.biosignal_readings
  ADD COLUMN IF NOT EXISTS room_pressure numeric;

COMMENT ON COLUMN public.biosignal_readings.room_pressure IS
  'Barometric pressure in the room the member slept in. Environment channel, absolute, units as reported by the instrument (hPa expected). The one channel no body-worn instrument reads.';
