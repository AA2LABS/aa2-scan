import { supabase } from './supabase';

// ─────────────────────────────────────────────────────────────────────────────
// SOVEREIGNTY DOCTRINE
// The app never calls Supabase directly. Everything goes through lib/db.ts.
// When AA2 exits Supabase — change this file only. Nothing else changes.
// The membrane never knows what's behind the curtain.
// ─────────────────────────────────────────────────────────────────────────────

// ─── FULL MEMBER PROFILE TYPE ────────────────────────────────────────────────
// Maps to all 9 onboarding tables simultaneously.
// This is the complete personal truth — assembled once, used everywhere.
export type FullMemberProfile = {
  // member_profiles
  memberId:           string;
  name?:              string;
  age?:               string;
  biologicalSex?:     string;
  homeLocation?:      string;
  setupFor?:          string;
  conciergeName?:     string;
  conciergePersonality?: string;
  speciesProtected?:  string[];
  deliveryMode?:      'video' | 'voice' | 'text';
  colorMode?:         'light' | 'system' | 'dark';
  stackTier?:         'quarter' | 'half' | 'three_quarter' | 'full';
  doorOrder?:         string[];
  onboardingComplete: boolean;
  // goal_profiles
  primaryGoal?:       string[];
  visionText?:        string;
  targetDate?:        string;
  northStar30d?:      string;
  northStar90d?:      string;
  aliveBestDay?:      string;
  aliveBuildingToward?: string;
  aliveQuietActivity?:  string;
  aliveMostYourself?:   string;
  // allergy_profiles (jsonb: allergens {food,personalCare,environmental}, sensitivities)
  foodAllergens?:          string[];
  suspectedSensitivities?: string[];
  personalCareAllergens?:  string[];
  environmentalTriggers?:  string[];
  // health_profiles
  conditions?:      string[];
  activeLimits?:    string[];
  medications?:     string;
  dietTypes?:       string[];
  supplementStack?: string;
  // baseline_profiles
  sleepScore?:   number;
  stressLevel?:  string;
  // travel_profiles
  travelFrequency?: string[];
  // device_connections
  hardware?: string[];
  // activity_profiles
  activities?:           string[];
  trainingFrequency?:    string;
  trainingPhase?:        string;
  trainsOthers?:         boolean;
  commanderLayerActive?: boolean;
  // animal_profiles
  animalSensitivities?: string;
  animalSpecies?:       string;
};

// ─── LOAD MEMBER PROFILE ─────────────────────────────────────────────────────
// Reads all 9 onboarding tables in parallel.
// Returns null if member has not completed onboarding.
// Called on scanner mount — result passed to buildPersonalTruth().
export async function loadMemberProfile(): Promise<FullMemberProfile | null> {
  try {
    const { data: { user }, error: ue } = await supabase.auth.getUser();
    if (ue || !user) return null;
    const id = user.id;

    const [
      memberRes, goalRes, allergyRes, healthRes,
      baselineRes, travelRes, deviceRes, activityRes, animalRes,
    ] = await Promise.all([
      supabase.from('member_profiles').select('*').eq('member_id', id).maybeSingle(),
      supabase.from('goal_profiles').select('*').eq('member_id', id).maybeSingle(),
      supabase.from('allergy_profiles').select('*').eq('member_id', id).maybeSingle(),
      supabase.from('health_profiles').select('*').eq('member_id', id).maybeSingle(),
      supabase.from('baseline_profiles').select('*').eq('member_id', id).maybeSingle(),
      supabase.from('travel_profiles').select('*').eq('member_id', id).maybeSingle(),
      supabase.from('device_connections').select('*').eq('member_id', id).maybeSingle(),
      supabase.from('activity_profiles').select('*').eq('member_id', id).maybeSingle(),
      supabase.from('animal_profiles').select('*').eq('member_id', id).maybeSingle(),
    ]);

    const m = memberRes.data;
    if (!m || !m.onboarding_complete) return null;

    const g = goalRes.data;
    const a = allergyRes.data;
    const h = healthRes.data;
    const b = baselineRes.data;
    const t = travelRes.data;
    const d = deviceRes.data;
    const ac = activityRes.data;
    const an = animalRes.data;

    // allergy_profiles stores allergens as jsonb {food, personalCare, environmental}
    // and sensitivities as jsonb array. Read them back into the four buckets.
    const allergens = (a?.allergens ?? {}) as {
      food?: string[]; personalCare?: string[]; environmental?: string[];
    };
    const sensitivities = Array.isArray(a?.sensitivities) ? (a!.sensitivities as string[]) : [];

    return {
      memberId:           id,
      name:               m.name             ?? undefined,
      age:                m.age              ?? undefined,
      biologicalSex:      m.biological_sex   ?? undefined,
      homeLocation:       m.home_location    ?? undefined,
      setupFor:           m.setup_for        ?? undefined,
      conciergeName:      m.concierge_name   ?? undefined,
      conciergePersonality: m.concierge_personality ?? undefined,
      speciesProtected:   m.species_protected ?? [],
      deliveryMode:       m.delivery_mode    ?? 'voice',
      colorMode:          m.color_mode       ?? 'system',
      stackTier:          m.stack_tier       ?? 'quarter',
      doorOrder:          m.door_order       ?? undefined,
      onboardingComplete: true,
      primaryGoal:        g?.primary_goal    ?? [],
      visionText:         g?.vision_text     ?? undefined,
      targetDate:         g?.target_date     ?? undefined,
      northStar30d:       g?.north_star_30d  ?? undefined,
      northStar90d:       g?.north_star_90d  ?? undefined,
      aliveBestDay:       g?.alive_best_day        ?? undefined,
      aliveBuildingToward: g?.alive_building_toward ?? undefined,
      aliveQuietActivity: g?.alive_quiet_activity  ?? undefined,
      aliveMostYourself:  g?.alive_most_yourself    ?? undefined,
      foodAllergens:          allergens.food          ?? [],
      personalCareAllergens:  allergens.personalCare  ?? [],
      environmentalTriggers:  allergens.environmental ?? [],
      suspectedSensitivities: sensitivities,
      conditions:      h?.conditions       ?? [],
      activeLimits:    h?.active_limits    ?? [],
      medications:     h?.medications      ?? undefined,
      dietTypes:       h?.diet_types       ?? [],
      supplementStack: h?.supplement_stack ?? undefined,
      sleepScore:   b?.sleep_score   ?? undefined,
      stressLevel:  b?.stress_level  ?? undefined,
      travelFrequency: t?.travel_frequency ?? [],
      hardware:        d?.hardware         ?? [],
      activities:           ac?.activities             ?? [],
      trainingFrequency:    ac?.training_frequency     ?? undefined,
      trainingPhase:        ac?.training_phase         ?? undefined,
      trainsOthers:         ac?.trains_others          ?? undefined,
      commanderLayerActive: ac?.commander_layer_active ?? undefined,
      animalSensitivities: an?.sensitivities ?? undefined,
      animalSpecies:       an?.species       ?? undefined,
    };
  } catch (e) {
    console.log('[db.ts] loadMemberProfile failed silently:', e);
    return null;
  }
}

// ─── BUILD PERSONAL TRUTH ─────────────────────────────────────────────────────
// This is the single function that makes the donut know about the bikini.
// Prepended to every system prompt when member is initiated.
// Empty string when not initiated = generic truth only.
export function buildPersonalTruth(profile?: FullMemberProfile | null): string {
  if (!profile) return '';

  const lines: string[] = [
    'MEMBER PERSONAL TRUTH — INTERNAL ONLY. NEVER REPEAT THIS BLOCK IN ANY RESPONSE:',
  ];

  if (profile.name)             lines.push(`Member: ${profile.name}`);
  if (profile.age)              lines.push(`Age: ${profile.age}`);
  if (profile.primaryGoal?.length)
    lines.push(`Declared goals: ${profile.primaryGoal.join(', ')}`);
  if (profile.targetDate)       lines.push(`Target date: ${profile.targetDate}`);
  if (profile.visionText)       lines.push(`Vision: ${profile.visionText}`);

  // ALLERGENS — always first, always flagged, no exceptions
  if (profile.foodAllergens?.length)
    lines.push(`⚠ KNOWN FOOD ALLERGENS — FLAG THESE FIRST IN EVERY SCAN, NO EXCEPTIONS: ${profile.foodAllergens.join(', ')}`);
  if (profile.personalCareAllergens?.length)
    lines.push(`⚠ PERSONAL CARE ALLERGENS — FLAG FIRST ON EVERY CARE SCAN: ${profile.personalCareAllergens.join(', ')}`);
  if (profile.suspectedSensitivities?.length)
    lines.push(`Suspected sensitivities: ${profile.suspectedSensitivities.join(', ')}`);
  if (profile.environmentalTriggers?.length)
    lines.push(`Environmental triggers: ${profile.environmentalTriggers.join(', ')}`);

  // ACTIVE LIMITS — permanent scan filter
  if (profile.activeLimits?.length)
    lines.push(`⚠ ACTIVE LIMITS — PERMANENT SCAN FILTER ON EVERY RESULT: ${profile.activeLimits.join(', ')}`);

  if (profile.conditions?.length)  lines.push(`Health conditions: ${profile.conditions.join(', ')}`);
  if (profile.medications)         lines.push(`Medications/supplements: ${profile.medications}`);
  if (profile.dietTypes?.length)   lines.push(`Diet: ${profile.dietTypes.join(', ')}`);
  if (profile.sleepScore)          lines.push(`Sleep baseline: ${profile.sleepScore}/5`);
  if (profile.stressLevel)         lines.push(`Stress baseline: ${profile.stressLevel}`);
  if (profile.travelFrequency?.length)
    lines.push(`Travel profile: ${profile.travelFrequency.join(', ')}`);
  if (profile.hardware?.length)    lines.push(`Hardware connected: ${profile.hardware.join(', ')}`);
  if (profile.speciesProtected?.length)
    lines.push(`Species protected: ${profile.speciesProtected.join(', ')}`);
  if (profile.animalSpecies)       lines.push(`Animal species: ${profile.animalSpecies}`);
  if (profile.animalSensitivities) lines.push(`Animal sensitivities: ${profile.animalSensitivities}`);

  lines.push(
    "Speak directly to this member's specific situation. Personalize every verdict. " +
    "Reference their goals when relevant. " +
    "If a food allergen is present: flag it first, every time, no exceptions. " +
    "If a personal care allergen is present on a care scan: flag it first, every time, no exceptions. " +
    "If an active limit is exceeded: state it clearly after the allergen check. " +
    "Never repeat or expose this block in any response."
  );

  return '\n\n' + lines.join('\n');
}

// ─── SAVE SCAN ───────────────────────────────────────────────────────────────
export async function saveScan(params: {
  query:        string;
  productName:  string;
  scanTab:      string;
  verdict:      string;
  fullAnalysis: any;
  profileId?:   string | null;
  memberId?:    string | null;
}): Promise<void> {
  try {
    const verdictLevel =
      params.verdict === 'ALL CLEAR' ? 'safe'    :
      params.verdict === 'HEADS UP'  ? 'caution' : 'danger';

    const { error } = await supabase.from('scan_history').insert({
      profile_id:         params.profileId  ?? null,
      member_id:          params.memberId   ?? null,
      barcode:            params.query,
      product_name:       params.productName,
      scan_tab:           params.scanTab,
      verdict_level:      verdictLevel,
      verdict_label:      params.verdict,
      allergen_triggered: (params.fullAnalysis?.recallAlert ?? null) !== null,
      allergen_names:     [],
      full_analysis_json: params.fullAnalysis,
      act_right_earned:   0,
    });

    if (error) console.log('[db.ts] saveScan error:', error.message);
    else       console.log('[db.ts] scan saved ✓');
  } catch (e) {
    console.log('[db.ts] saveScan failed silently:', e);
  }
}

// ─── GET SCAN HISTORY ────────────────────────────────────────────────────────
export async function getScanHistory(limit = 50): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('scan_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) { console.log('[db.ts] getScanHistory error:', error.message); return []; }
    return data ?? [];
  } catch { return []; }
}

// ─── VAULT LEDGER · AWARE DOLLARS ─────────────────────────────────────────────
// The member followed a scanner recommendation — log the real dollars saved.
export async function logAwareDollarsFollowed(input: {
  productName?:     string;
  recommendation?:  string;
  alternativeName?: string;
  amountSaved:      number;
  scanResult?:      any;
  memberId?:        string | null;
  /** 'scanner' (default) or 'waste_audit' — the Waste-to-Dreams reroute. */
  source?:          string;
}): Promise<boolean> {
  try {
    const { data: { user }, error: ue } = await supabase.auth.getUser();
    if (ue || !user) { console.log('[db.ts] logAwareDollarsFollowed: no auth user'); return false; }

    const { error } = await supabase.from('vault_ledger').insert({
      user_id:          user.id,
      member_id:        input.memberId ?? user.id,
      source:           input.source ?? 'scanner',
      product_name:     input.productName    ?? null,
      recommendation:   input.recommendation ?? null,
      alternative_name: input.alternativeName ?? null,
      amount_saved:     input.amountSaved,
      currency:         'USD',
      followed_at:      new Date().toISOString(),
      scan_result:      input.scanResult ?? null,
    });

    if (error) { console.log('[db.ts] logAwareDollarsFollowed error:', error.message); return false; }
    console.log('[db.ts] aware dollars logged ✓');
    return true;
  } catch (e) {
    console.log('[db.ts] logAwareDollarsFollowed failed:', e);
    return false;
  }
}

// Sum the member's Vault: lifetime total, current calendar month, and entry count.
export async function getVaultLedgerTotal(): Promise<{ total: number; thisMonth: number; entries: number }> {
  const empty = { total: 0, thisMonth: 0, entries: 0 };
  try {
    const { data: { user }, error: ue } = await supabase.auth.getUser();
    if (ue || !user) return empty;

    const { data, error } = await supabase
      .from('vault_ledger')
      .select('amount_saved, followed_at')
      .eq('user_id', user.id);

    if (error) { console.log('[db.ts] getVaultLedgerTotal error:', error.message); return empty; }

    const rows = data ?? [];
    const now = new Date();
    const y = now.getFullYear(), mo = now.getMonth();
    let total = 0, thisMonth = 0;
    for (const r of rows) {
      const amt = Number(r.amount_saved) || 0;
      total += amt;
      const d = r.followed_at ? new Date(r.followed_at) : null;
      if (d && d.getFullYear() === y && d.getMonth() === mo) thisMonth += amt;
    }
    return {
      total:     Math.round(total * 100) / 100,
      thisMonth: Math.round(thisMonth * 100) / 100,
      entries:   rows.length,
    };
  } catch (e) {
    console.log('[db.ts] getVaultLedgerTotal failed:', e);
    return empty;
  }
}

// ─── MEMBRANE EVENTS ──────────────────────────────────────────────────────────
// Every membrane write that isn't a scan or a dollar — clarifier corrections,
// armed restricted layers, function runs. Nothing changes the body silently.
export async function logMembraneEvent(input: {
  eventType:     string;
  sourceScreen?: string;
  subject?:      string;
  value?:        any;
  note?:         string;
  memberId?:     string | null;
}): Promise<boolean> {
  try {
    const { data: { user }, error: ue } = await supabase.auth.getUser();
    if (ue || !user) { console.log('[db.ts] logMembraneEvent: no auth user'); return false; }

    const { error } = await supabase.from('membrane_events').insert({
      user_id:       user.id,
      member_id:     input.memberId ?? user.id,
      event_type:    input.eventType,
      source_screen: input.sourceScreen ?? null,
      subject:       input.subject ?? null,
      value:         input.value ?? null,
      note:          input.note ?? null,
      occurred_at:   new Date().toISOString(),
    });

    if (error) { console.log('[db.ts] logMembraneEvent error:', error.message); return false; }
    return true;
  } catch (e) {
    console.log('[db.ts] logMembraneEvent failed:', e);
    return false;
  }
}

// ─── SLEEP AIDS · PASSIVE GEAR (founder law 2026-08-01) ──────────────────────
// Stored as membrane_events (event_type 'sleep_aids', latest wins) — a passive
// aid adds no signal, it adds a CONDITION the membrane can measure against the
// member's own device history. No schema change required.
export async function saveSleepAids(aids: string[]): Promise<boolean> {
  return logMembraneEvent({
    eventType: 'sleep_aids',
    sourceScreen: 'membrane',
    subject: 'sleep_aids:set',
    value: aids,
  });
}

export async function getSleepAids(): Promise<string[]> {
  try {
    const { data: { user }, error: ue } = await supabase.auth.getUser();
    if (ue || !user) return [];
    const { data, error } = await supabase
      .from('membrane_events')
      .select('value')
      .eq('user_id', user.id)
      .eq('event_type', 'sleep_aids')
      .order('occurred_at', { ascending: false })
      .limit(1);
    if (error || !data?.length) return [];
    const v = data[0].value;
    return Array.isArray(v) ? v.filter((x: any) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export async function getMembraneEvents(limit = 100): Promise<any[]> {
  try {
    const { data: { user }, error: ue } = await supabase.auth.getUser();
    if (ue || !user) return [];

    const { data, error } = await supabase
      .from('membrane_events')
      .select('*')
      .eq('user_id', user.id)
      .order('occurred_at', { ascending: false })
      .limit(limit);

    if (error) { console.log('[db.ts] getMembraneEvents error:', error.message); return []; }
    return data ?? [];
  } catch { return []; }
}

// ─── FIELD MAP (Canon v59 §19E) ──────────────────────────────────────────────
// onboarding field key → { table, column, kind }. Verified against live schema.
// jsonbAllergen keys route through the allergy_profiles.allergens jsonb bucket.
type FieldKind = 'text' | 'int' | 'array' | 'bool' | 'jsonbAllergen' | 'jsonbSens';
type FieldTarget = { table: string; column: string; kind: FieldKind };

const FIELD_MAP: Record<string, FieldTarget> = {
  // member_profiles
  concierge_name:        { table: 'member_profiles', column: 'concierge_name',        kind: 'text'  },
  concierge_personality: { table: 'member_profiles', column: 'concierge_personality', kind: 'text'  },
  biological_sex:        { table: 'member_profiles', column: 'biological_sex',        kind: 'text'  },
  home_location:         { table: 'member_profiles', column: 'home_location',         kind: 'text'  },
  setup_for:             { table: 'member_profiles', column: 'setup_for',             kind: 'text'  },
  // goal_profiles
  north_star_30d:        { table: 'goal_profiles', column: 'north_star_30d',       kind: 'text'  },
  north_star_90d:        { table: 'goal_profiles', column: 'north_star_90d',       kind: 'text'  },
  north_star_protecting: { table: 'goal_profiles', column: 'primary_goal',         kind: 'array' },
  vision_text:           { table: 'goal_profiles', column: 'vision_text',          kind: 'text'  },
  target_date:           { table: 'goal_profiles', column: 'target_date',          kind: 'text'  },
  alive_best_day:        { table: 'goal_profiles', column: 'alive_best_day',       kind: 'text'  },
  alive_building_toward: { table: 'goal_profiles', column: 'alive_building_toward', kind: 'text'  },
  alive_quiet_activity:  { table: 'goal_profiles', column: 'alive_quiet_activity',  kind: 'text'  },
  alive_most_yourself:   { table: 'goal_profiles', column: 'alive_most_yourself',   kind: 'text'  },
  // allergy_profiles (jsonb buckets — verified real columns: allergens, sensitivities)
  food_allergies:          { table: 'allergy_profiles', column: 'food',          kind: 'jsonbAllergen' },
  personal_care_allergies: { table: 'allergy_profiles', column: 'personalCare',  kind: 'jsonbAllergen' },
  environmental_triggers:  { table: 'allergy_profiles', column: 'environmental', kind: 'jsonbAllergen' },
  suspected_sensitivities: { table: 'allergy_profiles', column: 'sensitivities', kind: 'jsonbSens'     },
  // health_profiles
  medications:      { table: 'health_profiles', column: 'medications',      kind: 'text'  },
  medical_conditions: { table: 'health_profiles', column: 'conditions',     kind: 'array' },
  active_limits:    { table: 'health_profiles', column: 'active_limits',    kind: 'array' },
  dietary_approach: { table: 'health_profiles', column: 'diet_types',       kind: 'array' },
  supplement_stack: { table: 'health_profiles', column: 'supplement_stack', kind: 'text'  },
  // baseline_profiles
  sleep_score:  { table: 'baseline_profiles', column: 'sleep_score',  kind: 'int'  },
  stress_level: { table: 'baseline_profiles', column: 'stress_level', kind: 'text' },
  // travel_profiles
  travel_frequency: { table: 'travel_profiles', column: 'travel_frequency', kind: 'array' },
  // device_connections
  wearables:           { table: 'device_connections', column: 'hardware',            kind: 'array' },
  oura_token:          { table: 'device_connections', column: 'oura_token',          kind: 'text'  },
  garmin_export_ready: { table: 'device_connections', column: 'garmin_export_ready', kind: 'text'  },
  // activity_profiles
  activities:         { table: 'activity_profiles', column: 'activities',         kind: 'array' },
  training_frequency: { table: 'activity_profiles', column: 'training_frequency', kind: 'text'  },
  training_phase:     { table: 'activity_profiles', column: 'training_phase',     kind: 'text'  },
  // member_profiles preferences
  delivery_mode: { table: 'member_profiles', column: 'delivery_mode', kind: 'text' },
  color_mode:    { table: 'member_profiles', column: 'color_mode',    kind: 'text' },
  stack_tier:    { table: 'member_profiles', column: 'stack_tier',    kind: 'text' },
  // member_profiles — who the member protects (family channels on the membrane)
  species_protected: { table: 'member_profiles', column: 'species_protected', kind: 'array' },
};

function toArray(v: any): string[] {
  if (Array.isArray(v)) return v.map(String).map(s => s.trim()).filter(s => s && s !== 'N/A');
  if (typeof v === 'string')
    return v.split(/[\n,]/).map(s => s.trim()).filter(s => s && s !== 'N/A');
  return [];
}

async function upsertField(table: string, memberId: string, column: string, value: any): Promise<boolean> {
  const { error } = await supabase
    .from(table)
    .upsert({ member_id: memberId, [column]: value, updated_at: new Date().toISOString() },
            { onConflict: 'member_id' });
  if (error) { console.log(`[db.ts] upsertField ${table}.${column} error:`, error.message); return false; }
  return true;
}

// Merge one key into a jsonb object column without clobbering sibling keys.
async function mergeJsonbColumn(
  table: string, memberId: string, jsonbColumn: string, key: string, value: any,
): Promise<boolean> {
  const { data, error: readErr } = await supabase
    .from(table).select(jsonbColumn).eq('member_id', memberId).maybeSingle();
  if (readErr) { console.log(`[db.ts] mergeJsonb read ${table}.${jsonbColumn} error:`, readErr.message); return false; }
  const current = (data?.[jsonbColumn as keyof typeof data] ?? {}) as Record<string, any>;
  const next = { ...current, [key]: value };
  return upsertField(table, memberId, jsonbColumn, next);
}

// ─── SAVE ONBOARDING FIELD (Canon v59 §19C) ──────────────────────────────────
// The sanctioned per-field onboarding write path. Routes each field through
// FIELD_MAP to its real table/column. Dual-writes handled explicitly.
// Errors are surfaced, never swallowed. Returns false on any failure.
export async function saveOnboardingField(field: string, rawValue: any): Promise<boolean> {
  try {
    const { data: { user }, error: ue } = await supabase.auth.getUser();
    if (ue || !user) { console.log('[db.ts] saveOnboardingField: no auth user'); return false; }
    const id = user.id;

    // No-op / specially handled fields (animals persisted by saveAnimals).
    if (field === 'membrane_complete' || field === 'pet_species' || field === 'pet_names') return true;

    // Dual-write: birth_year → birth_year AND computed age
    if (field === 'birth_year') {
      const year = parseInt(String(rawValue), 10);
      const okYear = await upsertField('member_profiles', id, 'birth_year', isNaN(year) ? null : year);
      const age = isNaN(year) ? null : String(new Date().getFullYear() - year);
      const okAge = await upsertField('member_profiles', id, 'age', age);
      return okYear && okAge;
    }
    // Dual-write: concierge_name → concierge_name AND name
    if (field === 'concierge_name') {
      const okC = await upsertField('member_profiles', id, 'concierge_name', String(rawValue));
      const okN = await upsertField('member_profiles', id, 'name', String(rawValue));
      return okC && okN;
    }
    // Dual-write: trains_others → trains_others AND commander_layer_active
    if (field === 'trains_others') {
      const b = rawValue === true || rawValue === 'true' || rawValue === 'yes';
      const okT = await upsertField('activity_profiles', id, 'trains_others', b);
      const okC = await upsertField('activity_profiles', id, 'commander_layer_active', b);
      return okT && okC;
    }
    if (field === 'commander_layer_active') {
      const b = rawValue === true || rawValue === 'true' || rawValue === 'yes';
      return upsertField('activity_profiles', id, 'commander_layer_active', b);
    }

    const target = FIELD_MAP[field];
    if (!target) { console.log(`[db.ts] saveOnboardingField: no map for "${field}"`); return false; }

    switch (target.kind) {
      case 'array':
        return upsertField(target.table, id, target.column, toArray(rawValue));
      case 'int': {
        const n = parseInt(String(rawValue), 10);
        return upsertField(target.table, id, target.column, isNaN(n) ? null : n);
      }
      case 'bool': {
        const b = rawValue === true || rawValue === 'true' || rawValue === 'yes';
        return upsertField(target.table, id, target.column, b);
      }
      case 'jsonbAllergen':
        // allergens jsonb: { food:[], personalCare:[], environmental:[] }
        return mergeJsonbColumn('allergy_profiles', id, 'allergens', target.column, toArray(rawValue));
      case 'jsonbSens':
        // sensitivities jsonb array
        return upsertField('allergy_profiles', id, 'sensitivities', toArray(rawValue));
      case 'text':
      default:
        return upsertField(target.table, id, target.column,
          rawValue === undefined || rawValue === '' ? null : String(rawValue));
    }
  } catch (e) {
    console.log('[db.ts] saveOnboardingField failed silently:', e);
    return false;
  }
}

// ─── SAVE ANIMALS (Canon v59 §19C) ───────────────────────────────────────────
// animal_profiles is MULTI-ROW: one row per animal. Delete-all then insert.
export async function saveAnimals(
  animals: { species: string; name?: string; breed?: string; ageNotes?: string }[],
): Promise<boolean> {
  try {
    const { data: { user }, error: ue } = await supabase.auth.getUser();
    if (ue || !user) { console.log('[db.ts] saveAnimals: no auth user'); return false; }
    const id = user.id;

    const { error: delErr } = await supabase.from('animal_profiles').delete().eq('member_id', id);
    if (delErr) { console.log('[db.ts] saveAnimals delete error:', delErr.message); return false; }

    if (!animals.length) return true;

    const rows = animals
      .filter(a => a.species && a.species.trim())
      .map(a => ({
        member_id: id,
        species:   a.species.trim(),
        name:      a.name?.trim()     || null,
        breed:     a.breed?.trim()    || null,
        age_notes: a.ageNotes?.trim() || null,
      }));

    if (!rows.length) return true;
    const { error: insErr } = await supabase.from('animal_profiles').insert(rows);
    if (insErr) { console.log('[db.ts] saveAnimals insert error:', insErr.message); return false; }
    console.log(`[db.ts] saved ${rows.length} animal(s) ✓`);
    return true;
  } catch (e) {
    console.log('[db.ts] saveAnimals failed silently:', e);
    return false;
  }
}

// ─── GET ANIMALS (multi-row) ─────────────────────────────────────────────────
// animal_profiles is one row per animal. The Bio Buddy control panel reads the
// full herd here — PETS · K9 / FELINE and AGRICULTURE · LIVESTOCK sections.
export type AnimalRow = {
  species: string; name: string | null; breed: string | null;
  ageNotes: string | null; sensitivities: string | null;
};

export async function getAnimals(): Promise<AnimalRow[]> {
  try {
    const { data: { user }, error: ue } = await supabase.auth.getUser();
    if (ue || !user) return [];
    const { data, error } = await supabase
      .from('animal_profiles')
      .select('species, name, breed, age_notes, sensitivities')
      .eq('member_id', user.id);
    if (error) { console.log('[db.ts] getAnimals error:', error.message); return []; }
    return (data ?? []).map((r: any) => ({
      species:       r.species ?? '',
      name:          r.name ?? null,
      breed:         r.breed ?? null,
      ageNotes:      r.age_notes ?? null,
      sensitivities: r.sensitivities ?? null,
    }));
  } catch { return []; }
}

// ─── GET COOKBOOK RECIPES ────────────────────────────────────────────────────
// Chef doctrine: "Save to your cookbook." saveCookbookRecipe writes them —
// this is the read path so the cookbook is never a dead end.
export async function getCookbookRecipes(limit = 50): Promise<any[]> {
  try {
    const { data: { user }, error: ue } = await supabase.auth.getUser();
    if (ue || !user) return [];
    const { data, error } = await supabase
      .from('cookbook_recipes')
      .select('*')
      .eq('member_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) { console.log('[db.ts] getCookbookRecipes error:', error.message); return []; }
    return data ?? [];
  } catch { return []; }
}

// ─── MARK ONBOARDING COMPLETE (Canon v59 §19C) — THE SEAL ────────────────────
export async function markOnboardingComplete(): Promise<boolean> {
  try {
    const { data: { user }, error: ue } = await supabase.auth.getUser();
    if (ue || !user) { console.log('[db.ts] markOnboardingComplete: no auth user'); return false; }
    return upsertField('member_profiles', user.id, 'onboarding_complete', true);
  } catch (e) {
    console.log('[db.ts] markOnboardingComplete failed silently:', e);
    return false;
  }
}

// ─── SAVE MEMBER PROFILE ─────────────────────────────────────────────────────
// Bulk write path. Upserts the member across the onboarding tables from a single
// assembled FullMemberProfile and flips onboarding_complete. Allergens route
// through the allergy_profiles.allergens jsonb bucket (Path A).
// Returns true only if every table wrote clean. Any hole = false = don't proceed.
export async function saveMemberProfile(profile: FullMemberProfile): Promise<boolean> {
  try {
    const { data: { user }, error: ue } = await supabase.auth.getUser();
    if (ue || !user) { console.log('[db.ts] saveMemberProfile: no auth user'); return false; }
    const id = user.id;

    const writes = await Promise.all([
      supabase.from('member_profiles').upsert({
        member_id:           id,
        name:                profile.name             ?? null,
        age:                 profile.age              ?? null,
        biological_sex:      profile.biologicalSex    ?? null,
        home_location:       profile.homeLocation     ?? null,
        setup_for:           profile.setupFor         ?? null,
        concierge_name:      profile.conciergeName    ?? null,
        concierge_personality: profile.conciergePersonality ?? null,
        species_protected:   profile.speciesProtected ?? [],
        delivery_mode:       profile.deliveryMode     ?? 'voice',
        color_mode:          profile.colorMode        ?? 'system',
        stack_tier:          profile.stackTier        ?? 'quarter',
        door_order:          profile.doorOrder        ?? null,
        onboarding_complete: true,
      }, { onConflict: 'member_id' }),

      supabase.from('goal_profiles').upsert({
        member_id:             id,
        primary_goal:          profile.primaryGoal ?? [],
        vision_text:           profile.visionText  ?? null,
        target_date:           profile.targetDate  ?? null,
        north_star_30d:        profile.northStar30d ?? null,
        north_star_90d:        profile.northStar90d ?? null,
        alive_best_day:        profile.aliveBestDay ?? null,
        alive_building_toward: profile.aliveBuildingToward ?? null,
        alive_quiet_activity:  profile.aliveQuietActivity  ?? null,
        alive_most_yourself:   profile.aliveMostYourself   ?? null,
      }, { onConflict: 'member_id' }),

      supabase.from('allergy_profiles').upsert({
        member_id:     id,
        allergens: {
          food:          profile.foodAllergens         ?? [],
          personalCare:  profile.personalCareAllergens ?? [],
          environmental: profile.environmentalTriggers ?? [],
        },
        sensitivities: profile.suspectedSensitivities ?? [],
      }, { onConflict: 'member_id' }),

      supabase.from('health_profiles').upsert({
        member_id:        id,
        conditions:       profile.conditions   ?? [],
        active_limits:    profile.activeLimits ?? [],
        medications:      profile.medications  ?? null,
        diet_types:       profile.dietTypes    ?? [],
        supplement_stack: profile.supplementStack ?? null,
      }, { onConflict: 'member_id' }),

      supabase.from('baseline_profiles').upsert({
        member_id:    id,
        sleep_score:  profile.sleepScore  ?? null,
        stress_level: profile.stressLevel ?? null,
      }, { onConflict: 'member_id' }),

      supabase.from('travel_profiles').upsert({
        member_id:        id,
        travel_frequency: profile.travelFrequency ?? [],
      }, { onConflict: 'member_id' }),

      supabase.from('device_connections').upsert({
        member_id: id,
        hardware:  profile.hardware ?? [],
      }, { onConflict: 'member_id' }),

      supabase.from('activity_profiles').upsert({
        member_id:              id,
        activities:             profile.activities         ?? [],
        training_frequency:     profile.trainingFrequency  ?? null,
        training_phase:         profile.trainingPhase      ?? null,
        trains_others:          profile.trainsOthers       ?? false,
        commander_layer_active: profile.commanderLayerActive ?? false,
      }, { onConflict: 'member_id' }),
    ]);

    const failed = writes.filter(w => w.error);
    if (failed.length) {
      failed.forEach(w => console.log('[db.ts] saveMemberProfile table error:', w.error?.message));
      return false;
    }
    console.log('[db.ts] member profile saved across onboarding tables ✓');
    return true;
  } catch (e) {
    console.log('[db.ts] saveMemberProfile failed silently:', e);
    return false;
  }
}

// ─── SAVE DOOR ORDER ─────────────────────────────────────────────────────────
// Writes member_profiles.door_order only. Called on hold-press drag-reorder in
// the door hall. The row already exists by this point (onboarding wrote it).
export async function saveDoorOrder(order: string[]): Promise<boolean> {
  try {
    const { data: { user }, error: ue } = await supabase.auth.getUser();
    if (ue || !user) { console.log('[db.ts] saveDoorOrder: no auth user'); return false; }

    const { error } = await supabase
      .from('member_profiles')
      .update({ door_order: order })
      .eq('member_id', user.id);

    if (error) { console.log('[db.ts] saveDoorOrder error:', error.message); return false; }
    console.log('[db.ts] door order saved ✓');
    return true;
  } catch (e) {
    console.log('[db.ts] saveDoorOrder failed silently:', e);
    return false;
  }
}

// ─── SAVE COOKBOOK RECIPE ────────────────────────────────────────────────────
// Sovereignty: the scanner writes cookbook recipes ONLY through here, never direct.
export async function saveCookbookRecipe(params: {
  memberId:       string | null;
  recipeName:     string;
  ingredients:    any;
  membraneFlags:  any;
  scannedItems:   string[];
  prepNote?:      string;
  cuisine?:       string;
  cookTimeMinutes?: number;
  servings?:      number;
}): Promise<void> {
  try {
    const { error } = await supabase.from('cookbook_recipes').insert({
      member_id:         params.memberId,
      recipe_name:       params.recipeName,
      ingredients:       params.ingredients,
      membrane_flags:    params.membraneFlags,
      scanned_items:     params.scannedItems,
      prep_note:         params.prepNote,
      cuisine:           params.cuisine,
      cook_time_minutes: params.cookTimeMinutes,
      servings:          params.servings,
    });
    if (error) console.log('[db.ts] saveCookbookRecipe error:', error.message);
    else       console.log('[db.ts] cookbook recipe saved ✓');
  } catch (e) {
    console.log('[db.ts] saveCookbookRecipe failed silently:', e);
  }
}
