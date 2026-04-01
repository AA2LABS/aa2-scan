-- ─────────────────────────────────────────────────────────────────────────────
-- AA2 MIGRATION 004 — HARDWARE + BIOSIGNAL (BYOH Q18)
-- Run after 003_onboarding_tables.sql.
-- Spec referenced “profiles”; this project uses public.member_profiles.
-- Tokens are application-managed secrets — use Supabase Vault or Edge Functions
-- for field-level encryption in production; RLS limits exposure to the owner row.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.member_profiles
  ADD COLUMN IF NOT EXISTS oura_token text,
  ADD COLUMN IF NOT EXISTS garmin_api_key text,
  ADD COLUMN IF NOT EXISTS garmin_consumer_secret text,
  ADD COLUMN IF NOT EXISTS hrv_baseline_30d numeric,
  ADD COLUMN IF NOT EXISTS readiness_baseline_30d numeric;

CREATE TABLE IF NOT EXISTS public.biosignal_readings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source text NOT NULL CHECK (source IN ('oura', 'garmin', 'manual')),
  reading_date date NOT NULL,
  hrv_rmssd numeric,
  sleep_score numeric,
  readiness_score numeric,
  activity_score numeric,
  stress_level numeric,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS biosignal_readings_member_day_source
  ON public.biosignal_readings (member_id, reading_date, source);

CREATE INDEX IF NOT EXISTS idx_biosignal_readings_member_id
  ON public.biosignal_readings (member_id);

CREATE INDEX IF NOT EXISTS idx_biosignal_readings_reading_date
  ON public.biosignal_readings (reading_date);

ALTER TABLE public.biosignal_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_biosignal_readings"
  ON public.biosignal_readings
  FOR ALL
  USING (auth.uid() = member_id)
  WITH CHECK (auth.uid() = member_id);
