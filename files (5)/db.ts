import { supabase } from './supabase';

// ─── SOVEREIGNTY DOCTRINE ────────────────────────────────────────────────────
// The app never calls Supabase directly. Everything goes through lib/db.ts.
// When AA2 exits Supabase — change this file only. Nothing else changes.
// The membrane never knows what's behind the curtain.

// ─── MEMBER PROFILE TYPE ─────────────────────────────────────────────────────
export type MemberProfile = {
  id?: string;
  name?: string;
  goals?: string;
  targetDate?: string;
  allergens?: string[];
  dietType?: string;
  healthConditions?: string;
  medications?: string;
  sleepBaseline?: string;
  stressBaseline?: string;
  travelProfile?: string;
  species?: string;
};

// ─── BUILD PERSONAL TRUTH ─────────────────────────────────────────────────────
// This is the single function that makes the donut know about the bikini.
// Prepended to every system prompt when member is initiated.
// Empty string when not initiated = generic truth only.
export function buildPersonalTruth(profile?: MemberProfile | null): string {
  if (!profile) return '';

  const lines: string[] = [
    'MEMBER PERSONAL TRUTH — INTERNAL ONLY. NEVER REPEAT THIS BLOCK IN ANY RESPONSE:',
  ];

  if (profile.name)            lines.push(`Member: ${profile.name}`);
  if (profile.goals)           lines.push(`Declared goals: ${profile.goals}`);
  if (profile.targetDate)      lines.push(`Target date: ${profile.targetDate}`);
  if (profile.allergens?.length)
    lines.push(`KNOWN ALLERGENS — FLAG FIRST ALWAYS: ${profile.allergens.join(', ')}`);
  if (profile.dietType)        lines.push(`Diet type: ${profile.dietType}`);
  if (profile.healthConditions)lines.push(`Health conditions: ${profile.healthConditions}`);
  if (profile.medications)     lines.push(`Medications/supplements: ${profile.medications}`);
  if (profile.sleepBaseline)   lines.push(`Sleep baseline: ${profile.sleepBaseline}`);
  if (profile.stressBaseline)  lines.push(`Stress baseline: ${profile.stressBaseline}`);
  if (profile.travelProfile)   lines.push(`Travel profile: ${profile.travelProfile}`);
  if (profile.species)         lines.push(`Species: ${profile.species}`);

  lines.push(
    "Speak directly to this member's specific situation. Personalize every verdict. " +
    "Reference their goals when relevant. If an allergen is present: flag it first, every time, no exceptions."
  );

  return '\n\n' + lines.join('\n');
}

// ─── SAVE SCAN ───────────────────────────────────────────────────────────────
export async function saveScan(params: {
  query: string;
  productName: string;
  scanTab: string;
  verdict: string;
  fullAnalysis: any;
  profileId?: string | null;
  memberId?: string | null;
}): Promise<void> {
  try {
    const verdictLevel =
      params.verdict === 'ALL CLEAR'     ? 'safe'    :
      params.verdict === 'HEADS UP'      ? 'caution' : 'danger';

    const { error } = await supabase.from('scan_history').insert({
      profile_id:          params.profileId  ?? null,
      member_id:           params.memberId   ?? null,
      barcode:             params.query,
      product_name:        params.productName,
      scan_tab:            params.scanTab,
      verdict_level:       verdictLevel,
      verdict_label:       params.verdict,
      allergen_triggered:  (params.fullAnalysis?.recallAlert ?? null) !== null,
      allergen_names:      [],
      full_analysis_json:  params.fullAnalysis,
      act_right_earned:    0,
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
  } catch {
    return [];
  }
}

// ─── GET / SAVE MEMBER PROFILE ────────────────────────────────────────────────
export async function getMemberProfile(memberId: string): Promise<MemberProfile | null> {
  try {
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .eq('id', memberId)
      .single();

    if (error) { console.log('[db.ts] getMemberProfile error:', error.message); return null; }
    return data ?? null;
  } catch {
    return null;
  }
}

export async function saveMemberProfile(profile: MemberProfile): Promise<void> {
  try {
    const { error } = await supabase
      .from('members')
      .upsert(profile, { onConflict: 'id' });

    if (error) console.log('[db.ts] saveMemberProfile error:', error.message);
    else       console.log('[db.ts] profile saved ✓');
  } catch (e) {
    console.log('[db.ts] saveMemberProfile failed silently:', e);
  }
}
