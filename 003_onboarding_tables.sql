-- ─────────────────────────────────────────────────────────────────────────────
-- AA2 MIGRATION 003 — ONBOARDING TABLES
-- Adaptive Advantage Laboratories, S.A.
-- Run in Supabase SQL Editor before onboarding build.
-- ─────────────────────────────────────────────────────────────────────────────

-- ─── TABLE 1: member_profiles ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.member_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT,
  age             TEXT,
  species_protected TEXT[],
  delivery_mode   TEXT CHECK (delivery_mode IN ('video','voice','text')),
  color_mode      TEXT CHECK (color_mode IN ('light','system','dark')),
  stack_tier      TEXT CHECK (stack_tier IN ('quarter','half','three_quarter','full')),
  onboarding_complete BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (member_id)
);
ALTER TABLE public.member_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_rows" ON public.member_profiles
  FOR ALL USING (auth.uid() = member_id);

-- ─── TABLE 2: goal_profiles ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.goal_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  primary_goal    TEXT[],
  vision_text     TEXT,
  target_date     TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (member_id)
);
ALTER TABLE public.goal_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_rows" ON public.goal_profiles
  FOR ALL USING (auth.uid() = member_id);

-- ─── TABLE 3: allergy_profiles ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.allergy_profiles (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  food_allergens          TEXT[],
  suspected_sensitivities TEXT[],
  personal_care_allergens TEXT[],
  environmental_triggers  TEXT[],
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now(),
  UNIQUE (member_id)
);
ALTER TABLE public.allergy_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_rows" ON public.allergy_profiles
  FOR ALL USING (auth.uid() = member_id);

-- ─── TABLE 4: health_profiles ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.health_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conditions      TEXT[],
  active_limits   TEXT[],
  medications     TEXT,
  diet_types      TEXT[],
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (member_id)
);
ALTER TABLE public.health_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_rows" ON public.health_profiles
  FOR ALL USING (auth.uid() = member_id);

-- ─── TABLE 5: baseline_profiles ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.baseline_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sleep_score     INTEGER CHECK (sleep_score BETWEEN 1 AND 5),
  stress_level    TEXT CHECK (stress_level IN ('Low','Moderate','High','Unpredictable')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (member_id)
);
ALTER TABLE public.baseline_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_rows" ON public.baseline_profiles
  FOR ALL USING (auth.uid() = member_id);

-- ─── TABLE 6: travel_profiles ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.travel_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  travel_frequency TEXT[],
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (member_id)
);
ALTER TABLE public.travel_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_rows" ON public.travel_profiles
  FOR ALL USING (auth.uid() = member_id);

-- ─── TABLE 7: device_connections ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.device_connections (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hardware        TEXT[],
  stack_tier      TEXT CHECK (stack_tier IN ('quarter','half','three_quarter','full')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (member_id)
);
ALTER TABLE public.device_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_rows" ON public.device_connections
  FOR ALL USING (auth.uid() = member_id);

-- ─── TABLE 8: animal_profiles ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.animal_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sensitivities   TEXT,
  species         TEXT,
  breed           TEXT,
  age_notes       TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE (member_id)
);
ALTER TABLE public.animal_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_rows" ON public.animal_profiles
  FOR ALL USING (auth.uid() = member_id);

-- ─── TABLE 9: biosignal_history ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.biosignal_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uploaded_file   TEXT,
  input_tier      TEXT CHECK (input_tier IN ('VIDEO','VOICE','TEXT','HRV')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.biosignal_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_rows" ON public.biosignal_history
  FOR ALL USING (auth.uid() = member_id);

-- ─── INDEXES for fast member lookups ──────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_member_profiles_member_id    ON public.member_profiles(member_id);
CREATE INDEX IF NOT EXISTS idx_goal_profiles_member_id      ON public.goal_profiles(member_id);
CREATE INDEX IF NOT EXISTS idx_allergy_profiles_member_id   ON public.allergy_profiles(member_id);
CREATE INDEX IF NOT EXISTS idx_health_profiles_member_id    ON public.health_profiles(member_id);
CREATE INDEX IF NOT EXISTS idx_baseline_profiles_member_id  ON public.baseline_profiles(member_id);
CREATE INDEX IF NOT EXISTS idx_travel_profiles_member_id    ON public.travel_profiles(member_id);
CREATE INDEX IF NOT EXISTS idx_device_connections_member_id ON public.device_connections(member_id);
CREATE INDEX IF NOT EXISTS idx_animal_profiles_member_id    ON public.animal_profiles(member_id);
CREATE INDEX IF NOT EXISTS idx_biosignal_history_member_id  ON public.biosignal_history(member_id);

-- ─── UPDATED_AT trigger function ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ─── UPDATED_AT triggers on all profile tables ────────────────────────────────
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'member_profiles','goal_profiles','allergy_profiles',
    'health_profiles','baseline_profiles','travel_profiles',
    'device_connections','animal_profiles'
  ]
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS set_updated_at ON public.%I;
      CREATE TRIGGER set_updated_at
        BEFORE UPDATE ON public.%I
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    ', t, t);
  END LOOP;
END;
$$;
