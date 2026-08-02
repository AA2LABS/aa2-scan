// ─── lib/biosignals.ts ───────────────────────────────────────────────────────
// THE DEVICE WIRE — Garmin · Oura · Strava into the membrane.
// Writes public.biosignal_readings (migration 004), reads it back for the
// Bio Buddy LIVE READOUT. One table, every source, member's own baseline.
// Oura rides its cloud API (token in device_connections.oura_token).
// Garmin + Strava ride their official account exports (JSON / CSV) — the
// junk drawer is the onramp. Every write logs a membrane event.
// ─────────────────────────────────────────────────────────────────────────────

import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';
import { logMembraneEvent } from './db';
import { validateOuraToken, fetchOuraLast30Days, computeOuraBaselines } from './ouraSync';

export type BiosignalSource = 'oura' | 'garmin' | 'strava' | 'whoop' | 'beats' | 'manual';

export type BiosignalRow = {
  source: BiosignalSource;
  readingDate: string;          // YYYY-MM-DD
  hrv?: number | null;
  sleep?: number | null;
  readiness?: number | null;
  activity?: number | null;
  stress?: number | null;
};

export type SyncResult = { ok: boolean; days: number; message: string };

export type LiveReadout = {
  latest: Partial<Record<BiosignalSource, BiosignalRow>>;
  series: Partial<Record<BiosignalSource, number[]>>;  // oldest → newest, for sparklines
};

// ── WRITE ────────────────────────────────────────────────────────────────────
async function upsertReadings(rows: BiosignalRow[]): Promise<SyncResult> {
  try {
    const { data: { user }, error: ue } = await supabase.auth.getUser();
    if (ue || !user) return { ok: false, days: 0, message: 'Not signed in — the membrane has no member to write to.' };
    if (!rows.length) return { ok: false, days: 0, message: 'No readable days found in this source.' };

    const payload = rows.map(r => ({
      member_id:       user.id,
      source:          r.source,
      reading_date:    r.readingDate,
      hrv_rmssd:       r.hrv ?? null,
      sleep_score:     r.sleep ?? null,
      readiness_score: r.readiness ?? null,
      activity_score:  r.activity ?? null,
      stress_level:    r.stress ?? null,
    }));

    // NO-OVERLAP INTELLIGENCE: the membrane never double-counts a day.
    // (member_id, reading_date, source) is unique — a re-import refreshes in
    // place. Here we also COUNT what was already held, so the member is told
    // "new" vs "already had it" instead of silently writing.
    const dates = rows.map(r => r.readingDate);
    const lo = dates.reduce((a, b) => (a < b ? a : b));
    const hi = dates.reduce((a, b) => (a > b ? a : b));
    const { data: existing } = await supabase
      .from('biosignal_readings')
      .select('reading_date')
      .eq('member_id', user.id)
      .eq('source', rows[0].source)
      .gte('reading_date', lo)
      .lte('reading_date', hi);
    const had = new Set((existing ?? []).map((r: any) => r.reading_date));
    const newDays = dates.filter(d => !had.has(d)).length;
    const refreshed = dates.length - newDays;

    const { error } = await supabase
      .from('biosignal_readings')
      .upsert(payload, { onConflict: 'member_id,reading_date,source' });

    if (error) {
      console.log('[biosignals] upsert error:', error.message);
      if (/relation .* does not exist/i.test(error.message)) {
        return { ok: false, days: 0, message: 'biosignal_readings table is not live — run migration 004 in Supabase.' };
      }
      if (/violates check constraint/i.test(error.message)) {
        return { ok: false, days: 0, message: `Source "${rows[0]?.source}" not allowed yet — run migration 20260801 (biosignal sources) in Supabase.` };
      }
      return { ok: false, days: 0, message: error.message };
    }
    return {
      ok: true, days: newDays,
      message: refreshed > 0
        ? `${newDays} new day(s) written · ${refreshed} day(s) the membrane already held were refreshed in place — no overlaps, nothing double-counted.`
        : `${newDays} new day(s) written to the membrane.`,
    };
  } catch (e: any) {
    return { ok: false, days: 0, message: String(e?.message ?? e) };
  }
}

// ── READ — feeds LIVE READOUT · FULL STACK ──────────────────────────────────
export async function getLiveReadout(days = 30): Promise<LiveReadout> {
  const empty: LiveReadout = { latest: {}, series: {} };
  try {
    const { data: { user }, error: ue } = await supabase.auth.getUser();
    if (ue || !user) return empty;

    const since = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
    let { data, error } = await supabase
      .from('biosignal_readings')
      .select('source, reading_date, hrv_rmssd, sleep_score, readiness_score, activity_score, stress_level')
      .eq('member_id', user.id)
      .gte('reading_date', since)
      .order('reading_date', { ascending: true });

    if (error) { console.log('[biosignals] read error:', error.message); return empty; }

    // LAST KNOWN GOOD PROTOCOL (Canon v13, locked): if the recent window is
    // quiet — member imported historical exports, device on the charger, off
    // the grid — the membrane shows each source's most recent REAL signal
    // instead of a blank. Real data or no data. Never fake dates.
    if (!data || data.length === 0) {
      const { data: lkg, error: le } = await supabase
        .from('biosignal_readings')
        .select('source, reading_date, hrv_rmssd, sleep_score, readiness_score, activity_score, stress_level')
        .eq('member_id', user.id)
        .order('reading_date', { ascending: false })
        .limit(240);
      if (le) { console.log('[biosignals] lkg read error:', le.message); return empty; }
      data = (lkg ?? []).reverse();  // back to oldest → newest for the sparklines
    }

    const out: LiveReadout = { latest: {}, series: {} };
    for (const r of data ?? []) {
      const src = r.source as BiosignalSource;
      const row: BiosignalRow = {
        source: src, readingDate: r.reading_date,
        hrv: r.hrv_rmssd, sleep: r.sleep_score, readiness: r.readiness_score,
        activity: r.activity_score, stress: r.stress_level,
      };
      out.latest[src] = row; // ascending order → last write wins = newest
      const v = row.hrv ?? row.readiness ?? row.activity ?? row.sleep;
      if (v != null) (out.series[src] ??= []).push(Number(v));
    }
    return out;
  } catch { return empty; }
}

// ── COVERAGE — what the membrane already holds, per source ──────────────────
export type SourceCoverage = { firstDate: string | null; lastDate: string | null; days: number };

export async function getCoverage(source: BiosignalSource): Promise<SourceCoverage> {
  const empty: SourceCoverage = { firstDate: null, lastDate: null, days: 0 };
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return empty;
    const { data, count } = await supabase
      .from('biosignal_readings')
      .select('reading_date', { count: 'exact' })
      .eq('member_id', user.id)
      .eq('source', source)
      .order('reading_date', { ascending: true });
    const rows = data ?? [];
    return {
      firstDate: rows[0]?.reading_date ?? null,
      lastDate: rows[rows.length - 1]?.reading_date ?? null,
      days: count ?? rows.length,
    };
  } catch { return empty; }
}

// ── OURA — cloud API sync ────────────────────────────────────────────────────
export async function getOuraToken(): Promise<string | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from('device_connections').select('oura_token').eq('member_id', user.id).maybeSingle();
    return data?.oura_token ?? null;
  } catch { return null; }
}

export async function saveOuraToken(token: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    const clean = token.trim();
    if (!(await validateOuraToken(clean))) return false;
    const { error } = await supabase
      .from('device_connections')
      .upsert({ member_id: user.id, oura_token: clean, updated_at: new Date().toISOString() }, { onConflict: 'member_id' });
    return !error;
  } catch { return false; }
}

export async function syncOura(): Promise<SyncResult> {
  const token = await getOuraToken();
  if (!token) return { ok: false, days: 0, message: 'No Oura token on the membrane — paste it once and the ring feeds nightly.' };

  // INCREMENTAL: a member who imported in January and returns August 1st gets
  // ONLY the missing span — start from the last day the membrane holds
  // (minus a 2-day window, since Oura revises recent scores), never re-pulling
  // months already on record. Empty membrane = 30-day first fill.
  const cov = await getCoverage('oura');
  let startYmd: string | undefined;
  if (cov.lastDate) {
    const d = new Date(cov.lastDate + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() - 2);
    startYmd = d.toISOString().slice(0, 10);
  }
  const rows = await fetchOuraLast30Days(token, startYmd);
  if (!rows.length) return { ok: false, days: 0, message: 'Oura returned no days — check the token or the ring sync in the Oura app.' };

  const result = await upsertReadings(rows.map(r => ({
    source: 'oura' as const,
    readingDate: r.reading_date,
    hrv: r.hrv_rmssd ?? null,
    sleep: r.sleep_score ?? null,
    readiness: r.readiness_score ?? null,
    activity: r.activity_score ?? null,
    stress: r.stress_level ?? null,
  })));

  // 30-day baselines onto the member row — non-fatal if columns absent.
  if (result.ok) {
    try {
      const base = computeOuraBaselines(rows);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('member_profiles').update({
          hrv_baseline_30d: base.hrv_baseline_30d,
          readiness_baseline_30d: base.readiness_baseline_30d,
        }).eq('member_id', user.id);
      }
    } catch { /* baseline columns optional */ }
    logMembraneEvent({ eventType: 'device_sync', sourceScreen: 'biobuddy', subject: 'oura', value: { days: result.days } });
  }
  return result;
}

// ── GARMIN — official account export (JSON) ─────────────────────────────────
// Heuristic reader for Garmin export JSON: finds records carrying a date and
// any of sleep score / HRV / stress / body battery style values.
function iso(d: any): string | null {
  const s = String(d ?? '');
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function harvestGarmin(node: any, acc: Map<string, BiosignalRow>): void {
  if (Array.isArray(node)) { node.forEach(n => harvestGarmin(n, acc)); return; }
  if (!node || typeof node !== 'object') return;

  const date = iso(node.calendarDate ?? node.date ?? node.startTimestampGMT ?? node.sleepStartTimestampGMT);
  if (date) {
    const row = acc.get(date) ?? { source: 'garmin' as const, readingDate: date };
    const sleep = node.sleepScores?.overall?.value ?? node.overallSleepScore ?? node.sleepScore;
    const hrv   = node.lastNightAvg ?? node.weeklyAvg ?? node.hrvValue ?? node.avgOvernightHrv;
    const stress = node.averageStressLevel ?? node.avgStressLevel;
    if (typeof sleep === 'number') row.sleep = sleep;
    if (typeof hrv === 'number') row.hrv = hrv;
    if (typeof stress === 'number' && stress >= 0) row.stress = stress;
    if (row.sleep != null || row.hrv != null || row.stress != null) acc.set(date, row);
  }
  for (const k of Object.keys(node)) {
    const v = (node as any)[k];
    if (v && typeof v === 'object') harvestGarmin(v, acc);
  }
}

export async function importGarminExport(): Promise<SyncResult> {
  const picked = await DocumentPicker.getDocumentAsync({ type: ['application/json', 'text/*'], copyToCacheDirectory: true });
  if (picked.canceled || !picked.assets?.[0]) return { ok: false, days: 0, message: 'Import cancelled.' };
  try {
    const raw = await FileSystem.readAsStringAsync(picked.assets[0].uri);
    const json = JSON.parse(raw);
    const acc = new Map<string, BiosignalRow>();
    harvestGarmin(json, acc);
    const result = await upsertReadings([...acc.values()]);
    if (result.ok) logMembraneEvent({ eventType: 'device_import', sourceScreen: 'biobuddy', subject: 'garmin', value: { days: result.days } });
    return result;
  } catch (e: any) {
    return { ok: false, days: 0, message: `Could not read that file as a Garmin JSON export. ${e?.message ?? ''}`.trim() };
  }
}

// ── STRAVA — official account export (activities.csv) ───────────────────────
// Daily activity load: sums distance (mi) per day from the activities CSV.
export async function importStravaExport(): Promise<SyncResult> {
  const picked = await DocumentPicker.getDocumentAsync({ type: ['text/*', 'application/*'], copyToCacheDirectory: true });
  if (picked.canceled || !picked.assets?.[0]) return { ok: false, days: 0, message: 'Import cancelled.' };
  try {
    const raw = await FileSystem.readAsStringAsync(picked.assets[0].uri);
    const lines = raw.split(/\r?\n/).filter(l => l.trim().length);
    if (lines.length < 2) return { ok: false, days: 0, message: 'That CSV has no activity rows.' };

    // Header-driven: find the date + distance columns wherever Strava put them.
    const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const dateIdx = header.findIndex(h => h === 'activity date' || h === 'date');
    const distIdx = header.findIndex(h => h === 'distance');
    if (dateIdx < 0 || distIdx < 0) return { ok: false, days: 0, message: 'Could not find Activity Date / Distance columns — is this the Strava activities.csv?' };

    const perDay = new Map<string, number>();
    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',');
      const d = new Date(String(cols[dateIdx]).replace(/"/g, ''));
      if (isNaN(d.getTime())) continue;
      const date = d.toISOString().slice(0, 10);
      const distKm = parseFloat(String(cols[distIdx]).replace(/"/g, ''));
      if (isNaN(distKm)) continue;
      const miles = distKm * 0.621371;
      perDay.set(date, (perDay.get(date) ?? 0) + miles);
    }

    const rows: BiosignalRow[] = [...perDay.entries()].map(([date, mi]) => ({
      source: 'strava' as const, readingDate: date, activity: Math.round(mi * 10) / 10,
    }));
    const result = await upsertReadings(rows);
    if (result.ok) logMembraneEvent({ eventType: 'device_import', sourceScreen: 'biobuddy', subject: 'strava', value: { days: result.days } });
    return result;
  } catch (e: any) {
    return { ok: false, days: 0, message: `Could not read that file as a Strava export. ${e?.message ?? ''}`.trim() };
  }
}

// ── STACK CONSENSUS — same day · every device · one assessment ───────────────
// The founder's law (2026-08-01): AA2 takes the same daily data and gives an
// assessment of all devices compared. Deterministic — computed from the
// member's own readings, never improvised.
export type ConsensusRow = { metric: string; values: { source: BiosignalSource; label: string }[] };
export type StackConsensus = {
  day: string | null;
  rows: ConsensusRow[];
  notes: string[];              // the assessment lines
};

export async function getStackConsensus(): Promise<StackConsensus> {
  const empty: StackConsensus = { day: null, rows: [], notes: [] };
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return empty;

    const { data, error } = await supabase
      .from('biosignal_readings')
      .select('source, reading_date, hrv_rmssd, sleep_score, readiness_score, activity_score, stress_level')
      .eq('member_id', user.id)
      .order('reading_date', { ascending: false })
      .limit(400);
    if (error || !data?.length) return empty;

    // Group by day; find the newest day carrying 2+ sources.
    const byDay = new Map<string, any[]>();
    for (const r of data) {
      const arr = byDay.get(r.reading_date) ?? [];
      arr.push(r); byDay.set(r.reading_date, arr);
    }
    const day = [...byDay.keys()].find(d => (byDay.get(d)?.length ?? 0) >= 2) ?? null;
    if (!day) return { day: null, rows: [], notes: ['One source on the wire so far — connect a second device and the consensus reads begin.'] };

    const rows: ConsensusRow[] = [];
    const dayRows = byDay.get(day)!;
    const push = (metric: string, field: string, fmt: (v: number) => string) => {
      const values = dayRows
        .filter(r => r[field] != null)
        .map(r => ({ source: r.source as BiosignalSource, label: fmt(Number(r[field])) }));
      if (values.length) rows.push({ metric, values });
    };
    push('SLEEP',     'sleep_score',     v => `${Math.round(v)}`);
    push('READINESS', 'readiness_score', v => `${Math.round(v)}`);
    push('HRV',       'hrv_rmssd',       v => `${Math.round(v)}ms`);
    push('STRESS',    'stress_level',    v => `${Math.round(v)}`);
    push('ACTIVITY',  'activity_score',  v => `${v}`);

    // Assessment: 90-day sleep-score offset between sources that share nights.
    const notes: string[] = [];
    const sleepPairs: Record<string, number[]> = {};
    for (const [, rs] of byDay) {
      const withSleep = rs.filter(r => r.sleep_score != null);
      for (let i = 0; i < withSleep.length; i++) {
        for (let j = i + 1; j < withSleep.length; j++) {
          const key = [withSleep[i].source, withSleep[j].source].sort().join('·');
          (sleepPairs[key] ??= []).push(Number(withSleep[i].sleep_score) - Number(withSleep[j].sleep_score));
        }
      }
    }
    for (const [pair, diffs] of Object.entries(sleepPairs)) {
      if (diffs.length < 5) continue;
      const [a, b] = pair.split('·');
      const mean = diffs.reduce((x, y) => x + y, 0) / diffs.length;
      const hi = mean >= 0 ? a : b;
      const lo = mean >= 0 ? b : a;
      notes.push(
        `${diffs.length} shared nights: ${hi.toUpperCase()} scores sleep ${Math.abs(mean).toFixed(0)} points above ${lo.toUpperCase()}. Neither is lying — different instruments, different judges. Trust each device's TREND against its own baseline, not one night's number.`,
      );
    }
    const sleepRow = rows.find(r => r.metric === 'SLEEP');
    if (sleepRow && sleepRow.values.length >= 2) {
      notes.push('Same body, same night, every judge on the record above — divergence itself is data: when ALL sources dip together, that is a real signal.');
    }
    return { day, rows, notes };
  } catch { return empty; }
}
