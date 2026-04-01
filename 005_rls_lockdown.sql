-- ─────────────────────────────────────────────────────────────────────────────
-- AA2 MIGRATION 005 — RLS LOCKDOWN
-- Closes all 30 exposed tables. Data sovereignty doctrine enforced.
-- Run in Supabase SQL Editor. One block. One execution.
-- ─────────────────────────────────────────────────────────────────────────────

-- STEP 1: Enable RLS on all 30 exposed tables
ALTER TABLE public.equalizer_events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visualizer_settings     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concierge_interactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_reservations       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_grants       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_dashboard        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aa2_qr_codes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chauffeur_routes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.first_aid_events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.awareness_flags         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legacy_trips            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.travel_engine           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cooking_sessions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_lists           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_content       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canaan_sessions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audio_learning          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.language_learning       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_records          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_data            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mental_regulation       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_settings      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dependent_care          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.k9_profiles             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equestrian_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agricultural_profiles   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tactical_profiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_access         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_groups        ENABLE ROW LEVEL SECURITY;

-- STEP 2: Member-owns-their-own-data policy for each table
-- Pattern: authenticated user can only see and write their own rows
-- All tables use member_id as the ownership column

CREATE POLICY "member_select_own" ON public.equalizer_events        FOR ALL USING (auth.uid() = member_id);
CREATE POLICY "member_select_own" ON public.visualizer_settings     FOR ALL USING (auth.uid() = member_id);
CREATE POLICY "member_select_own" ON public.concierge_interactions  FOR ALL USING (auth.uid() = member_id);
CREATE POLICY "member_select_own" ON public.trip_reservations       FOR ALL USING (auth.uid() = member_id);
CREATE POLICY "member_select_own" ON public.family_dashboard        FOR ALL USING (auth.uid() = member_id);
CREATE POLICY "member_select_own" ON public.aa2_qr_codes            FOR ALL USING (auth.uid() = member_id);
CREATE POLICY "member_select_own" ON public.chauffeur_routes        FOR ALL USING (auth.uid() = member_id);
CREATE POLICY "member_select_own" ON public.first_aid_events        FOR ALL USING (auth.uid() = member_id);
CREATE POLICY "member_select_own" ON public.awareness_flags         FOR ALL USING (auth.uid() = member_id);
CREATE POLICY "member_select_own" ON public.legacy_trips            FOR ALL USING (auth.uid() = member_id);
CREATE POLICY "member_select_own" ON public.travel_engine           FOR ALL USING (auth.uid() = member_id);
CREATE POLICY "member_select_own" ON public.cooking_sessions        FOR ALL USING (auth.uid() = member_id);
CREATE POLICY "member_select_own" ON public.grocery_lists           FOR ALL USING (auth.uid() = member_id);
CREATE POLICY "member_select_own" ON public.canaan_sessions         FOR ALL USING (auth.uid() = member_id);
CREATE POLICY "member_select_own" ON public.audio_learning          FOR ALL USING (auth.uid() = member_id);
CREATE POLICY "member_select_own" ON public.language_learning       FOR ALL USING (auth.uid() = member_id);
CREATE POLICY "member_select_own" ON public.health_records          FOR ALL USING (auth.uid() = member_id);
CREATE POLICY "member_select_own" ON public.fitness_data            FOR ALL USING (auth.uid() = member_id);
CREATE POLICY "member_select_own" ON public.mental_regulation       FOR ALL USING (auth.uid() = member_id);
CREATE POLICY "member_select_own" ON public.household_settings      FOR ALL USING (auth.uid() = member_id);
CREATE POLICY "member_select_own" ON public.dependent_care          FOR ALL USING (auth.uid() = member_id);
CREATE POLICY "member_select_own" ON public.k9_profiles             FOR ALL USING (auth.uid() = member_id);
CREATE POLICY "member_select_own" ON public.equestrian_profiles     FOR ALL USING (auth.uid() = member_id);
CREATE POLICY "member_select_own" ON public.agricultural_profiles   FOR ALL USING (auth.uid() = member_id);
CREATE POLICY "member_select_own" ON public.tactical_profiles       FOR ALL USING (auth.uid() = member_id);
CREATE POLICY "member_select_own" ON public.athlete_profiles        FOR ALL USING (auth.uid() = member_id);
CREATE POLICY "member_select_own" ON public.clinical_access         FOR ALL USING (auth.uid() = member_id);

-- STEP 3: Special policies for shared/public-read tables

-- permission_grants: member can see grants where they are the grantor or grantee
CREATE POLICY "member_select_own" ON public.permission_grants
  FOR ALL USING (auth.uid() = grantor_id OR auth.uid() = grantee_id);

-- community_groups: members can read all groups (community feed is public within AA2)
-- but only write their own entries
CREATE POLICY "member_read_all_groups" ON public.community_groups
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "member_write_own_group" ON public.community_groups
  FOR INSERT WITH CHECK (auth.uid() = member_id);
CREATE POLICY "member_update_own_group" ON public.community_groups
  FOR UPDATE USING (auth.uid() = member_id);

-- education_content: authenticated members can read all content (it's curriculum)
-- only service role can write
CREATE POLICY "member_read_education" ON public.education_content
  FOR SELECT USING (auth.role() = 'authenticated');

-- ─── ADDITIVE SCHEMA (BYOH Q18) — see 004_hardware_biosignal.sql ───────────────
-- Run 004_hardware_biosignal.sql after 003 for member_profiles token columns +
-- public.biosignal_readings (RLS included in that migration).
