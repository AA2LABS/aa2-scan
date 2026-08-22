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
import { getValidOuraToken } from './ouraAuth';
import { connectionFor } from './oauth';
import { fetchWhoopRange } from './whoopSync';
import { fetchStravaRange } from './stravaSync';
import { parseGarminExport, GARMIN_NIGHT_FILES, type GarminFile } from './garminImport';
import { parseOuraExport, countNightFields } from './ouraExport';
import { parseWhoopExport, toBiosignalRows as whoopRows } from './whoopImport';

/**
 * THE CROWN HAS HAD A SEAT SINCE 2026-08-14 AND NOTHING EVER SAT IN IT.
 *
 * supabase/migrations/20260814210000_origin_source.sql widened the database's
 * own CHECK constraint on BOTH source and origin_source to include 'muse' a
 * week ago. The membrane was made ready for the Crown. The app never used the
 * slot — this union simply never caught up, so no code path could write a
 * Muse reading even though the database would have accepted one.
 *
 * The same disease AA2 diagnosed in Muse — measured, stored, never wired —
 * was sitting inside AA2. Found and closed 2026-08-21.
 */
// 'ozlo' joins 2026-08-22 by founder order. It is the only instrument in the
// stack that measures THE ROOM rather than the member — and it is MASK-AGNOSTIC:
// the buds go under the Manta as readily as under the Ozlo mask, so the room is
// measured in every configuration, not only the ones that include one product.
export type BiosignalSource = 'oura' | 'garmin' | 'strava' | 'whoop' | 'beats' | 'muse' | 'ozlo' | 'manual';

export type BiosignalRow = {
  source: BiosignalSource;
  readingDate: string;          // YYYY-MM-DD

  // ── scores — a vendor's opinion of the night ──
  hrv?: number | null;
  sleep?: number | null;
  readiness?: number | null;
  activity?: number | null;
  stress?: number | null;

  // ── THE FULL NIGHT (founder order 2026-08-21) ─────────────────────────────
  // On 2026-08-20 four instruments returned four verdicts on one body and the
  // three biggest disagreements — deep sleep, awake time, and bedtime — had no
  // columns to land in. A score is an opinion. The night is the measurement.
  bedtimeStart?: string | null;
  bedtimeEnd?: string | null;
  totalSleepMin?: number | null;
  timeInBedMin?: number | null;
  deepMin?: number | null;
  remMin?: number | null;
  lightMin?: number | null;
  awakeMin?: number | null;
  efficiencyPct?: number | null;
  latencyMin?: number | null;
  restingHr?: number | null;
  avgHr?: number | null;
  minHr?: number | null;
  spo2Avg?: number | null;
  spo2Min?: number | null;
  respirationAvg?: number | null;
  breathingIndex?: number | null;
  skinTempDelta?: number | null;
  /**
   * ─── THE ROOM ─────────────────────────────────────────────────────────────
   * These three measure THE PLACE, not the person. They are kept beside the
   * body channels and NEVER averaged into a body baseline.
   *
   * roomTempC is ABSOLUTE degrees, and that is the point. skinTempDelta is
   * already a deviation from the member's OWN baseline; room temperature is a
   * fact about the room. Put together they answer the one question neither can
   * answer alone:
   *     skin moves + room holds -> the MASK did it
   *     skin moves + room moves -> the ROOM did it
   */
  roomTempC?: number | null;
  roomLight?: number | null;
  roomNoiseDb?: number | null;
  // RESTLESS MOMENTS ARE NOT AWAKENINGS. Garmin logged 30 and Muse 35 — those
  // agree. WHOOP logged 7 wake events, a different question. Kept apart so the
  // membrane never reports two answers to one question as a disagreement.
  restlessMoments?: number | null;
  wakeEvents?: number | null;
  vo2max?: number | null;
  vo2maxEstimated?: boolean | null;
  // The pipe is not the sensor. One heartbeat, one vote.
  originSource?: BiosignalSource | null;
};

// Every column the night has. Selected everywhere so a reader is never handed
// a partial night and forced to guess. Added 2026-08-21 with THE FULL NIGHT.
const NIGHT_COLUMNS =
  'source, origin_source, reading_date, hrv_rmssd, sleep_score, readiness_score, ' +
  'activity_score, stress_level, bedtime_start, bedtime_end, total_sleep_min, ' +
  'time_in_bed_min, deep_min, rem_min, light_min, awake_min, efficiency_pct, ' +
  'latency_min, resting_hr, avg_hr, min_hr, spo2_avg, spo2_min, respiration_avg, ' +
  'breathing_index, skin_temp_delta, restless_moments, wake_events, vo2max, ' +
  'vo2max_estimated, room_temp_c, room_light, room_noise_db';

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
      member_id:        user.id,
      source:           r.source,
      origin_source:    r.originSource ?? null,
      reading_date:     r.readingDate,
      hrv_rmssd:        r.hrv ?? null,
      sleep_score:      r.sleep ?? null,
      readiness_score:  r.readiness ?? null,
      activity_score:   r.activity ?? null,
      stress_level:     r.stress ?? null,
      // ── THE FULL NIGHT ──
      bedtime_start:    r.bedtimeStart ?? null,
      bedtime_end:      r.bedtimeEnd ?? null,
      total_sleep_min:  r.totalSleepMin ?? null,
      time_in_bed_min:  r.timeInBedMin ?? null,
      deep_min:         r.deepMin ?? null,
      rem_min:          r.remMin ?? null,
      light_min:        r.lightMin ?? null,
      awake_min:        r.awakeMin ?? null,
      efficiency_pct:   r.efficiencyPct ?? null,
      latency_min:      r.latencyMin ?? null,
      resting_hr:       r.restingHr ?? null,
      avg_hr:           r.avgHr ?? null,
      min_hr:           r.minHr ?? null,
      spo2_avg:         r.spo2Avg ?? null,
      spo2_min:         r.spo2Min ?? null,
      respiration_avg:  r.respirationAvg ?? null,
      breathing_index:  r.breathingIndex ?? null,
      skin_temp_delta:  r.skinTempDelta ?? null,
      restless_moments: r.restlessMoments ?? null,
      wake_events:      r.wakeEvents ?? null,
      vo2max:           r.vo2max ?? null,
      vo2max_estimated: r.vo2maxEstimated ?? null,
      // THE ROOM — absolute, never a delta, never folded into a body baseline.
      room_temp_c:      r.roomTempC ?? null,
      room_light:       r.roomLight ?? null,
      room_noise_db:    r.roomNoiseDb ?? null,
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
      .select(NIGHT_COLUMNS)
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
        .select(NIGHT_COLUMNS)
        .eq('member_id', user.id)
        .order('reading_date', { ascending: false })
        .limit(240);
      if (le) { console.log('[biosignals] lkg read error:', le.message); return empty; }
      data = (lkg ?? []).reverse();  // back to oldest → newest for the sparklines
    }

    const out: LiveReadout = { latest: {}, series: {} };
    // NIGHT_COLUMNS is a constant, so the typed client cannot infer the row
    // shape the way it did from an inline literal. The schema is the contract.
    for (const r of ((data ?? []) as any[])) {
      const src = r.source as BiosignalSource;
      const row: BiosignalRow = {
        source: src, readingDate: r.reading_date,
        originSource: (r.origin_source ?? null) as BiosignalSource | null,
        hrv: r.hrv_rmssd, sleep: r.sleep_score, readiness: r.readiness_score,
        activity: r.activity_score, stress: r.stress_level,
        bedtimeStart: r.bedtime_start ?? null,
        bedtimeEnd: r.bedtime_end ?? null,
        totalSleepMin: r.total_sleep_min ?? null,
        timeInBedMin: r.time_in_bed_min ?? null,
        deepMin: r.deep_min ?? null,
        remMin: r.rem_min ?? null,
        lightMin: r.light_min ?? null,
        awakeMin: r.awake_min ?? null,
        efficiencyPct: r.efficiency_pct ?? null,
        latencyMin: r.latency_min ?? null,
        restingHr: r.resting_hr ?? null,
        avgHr: r.avg_hr ?? null,
        minHr: r.min_hr ?? null,
        spo2Avg: r.spo2_avg ?? null,
        spo2Min: r.spo2_min ?? null,
        respirationAvg: r.respiration_avg ?? null,
        breathingIndex: r.breathing_index ?? null,
        skinTempDelta: r.skin_temp_delta ?? null,
        restlessMoments: r.restless_moments ?? null,
        wakeEvents: r.wake_events ?? null,
        vo2max: r.vo2max ?? null,
        vo2maxEstimated: r.vo2max_estimated ?? null,
        roomTempC: r.room_temp_c ?? null,
        roomLight: r.room_light ?? null,
        roomNoiseDb: r.room_noise_db ?? null,
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
/**
 * TWO LANES, IN ORDER OF TRUST — founder order 2026-08-21, "MAKE A PIPE."
 *
 *   1. OAUTH (lib/ouraAuth.ts). The member tapped CONNECT, Oura's own sign-in
 *      approved the scopes, and the credential lives in this device's vault —
 *      not in a database column. It renews itself and the member can revoke it
 *      from Oura's own connected-applications page without touching AA2.
 *
 *   2. PERSONAL ACCESS TOKEN. The old lane. Oura no longer issues these, so it
 *      is kept ONLY so a member who already pasted one keeps working. It is
 *      never offered as the first road and it is never the road AA2 asks for.
 *
 * Nothing downstream changes. syncOura and every reader call this one function
 * and get a live token, whichever lane produced it.
 */
export async function getOuraToken(): Promise<string | null> {
  // LANE 1 — OAuth, refreshed on the spot if it has gone stale.
  try {
    const oauth = await getValidOuraToken();
    if (oauth) return oauth;
  } catch {}

  // LANE 2 — the legacy pasted token, for members who already have one.
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
    originSource: 'oura' as const,
    readingDate: r.reading_date,
    hrv: r.hrv_rmssd ?? null,
    sleep: r.sleep_score ?? null,
    readiness: r.readiness_score ?? null,
    activity: r.activity_score ?? null,
    stress: r.stress_level ?? null,
    // ── THE FULL NIGHT — Oura was already returning all of this ──
    bedtimeStart: r.bedtime_start ?? null,
    bedtimeEnd: r.bedtime_end ?? null,
    totalSleepMin: r.total_sleep_min ?? null,
    timeInBedMin: r.time_in_bed_min ?? null,
    deepMin: r.deep_min ?? null,
    remMin: r.rem_min ?? null,
    lightMin: r.light_min ?? null,
    awakeMin: r.awake_min ?? null,
    efficiencyPct: r.efficiency_pct ?? null,
    latencyMin: r.latency_min ?? null,
    restingHr: r.resting_hr ?? null,
    avgHr: r.avg_hr ?? null,
    minHr: r.min_hr ?? null,
    spo2Avg: r.spo2_avg ?? null,
    respirationAvg: r.respiration_avg ?? null,
    breathingIndex: r.breathing_index ?? null,
    skinTempDelta: r.skin_temp_delta ?? null,
    restlessMoments: r.restless_moments ?? null,
    // NO ROOM HERE, DELIBERATELY. This is the Oura lane. A ring measures the
    // finger, not the bedroom — the room belongs to the Ozlo case alone.
  })));

  // 30-day baselines onto the member row — non-fatal if columns absent.
  if (result.ok) {
    try {
      const base = computeOuraBaselines(rows);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // supabase-js returns its error in the RESULT — it does not throw. The
        // old try/catch around this write caught nothing while the columns
        // did not exist, and the baselines silently landed nowhere from
        // 2026-08-01 to 2026-08-22. The error is now READ, not assumed away.
        const { error: baseErr } = await supabase.from('member_profiles').update({
          hrv_baseline_30d: base.hrv_baseline_30d,
          readiness_baseline_30d: base.readiness_baseline_30d,
        }).eq('member_id', user.id);
        if (baseErr) console.log('[biosignals] baseline write FAILED:', baseErr.message);
      }
    } catch (e) { console.log('[biosignals] baseline write threw:', e); }
    logMembraneEvent({ eventType: 'device_sync', sourceScreen: 'biobuddy', subject: 'oura', value: { days: result.days } });
  }
  return result;
}

// ── OURA — ACCOUNT EXPORT · THE ARCHIVE LANE ────────────────────────────────
// FOUNDER FINDING 2026-08-21: the Personal Access Token created 2026-04-02 is
// masked and unrecoverable, and Oura has stopped issuing new ones — the LEDGER
// lane is shut until OAuth2 exists. NOTHING IS MISSING: a full account export
// was already on the founder's own disk, and it carries the SAME field names
// the cloud API uses, so one parser serves both lanes. When OAuth lands, the
// API fills forward from where the archive stops and nothing gets rewritten.
//
// Pick the whole "App Data" folder at once. Every file is optional — hand it
// only sleepmodel.csv and it still produces full nights.
// ── WHOOP — cloud API sync (THE LEDGER LANE) ────────────────────────────────
/**
 * FOUNDER ORDER 2026-08-21: "MAKE A FUCKING PIPE!"
 * WHOOP was archive-only: request an export, wait for an email, download a zip.
 * This is the live lane on the member's own OAuth grant. Same incremental rule
 * as Oura — never re-pull months already on the membrane.
 */
export async function syncWhoop(): Promise<SyncResult> {
  const conn = await connectionFor('whoop');
  if (!conn.connected) {
    return { ok: false, days: 0, message: 'WHOOP is not connected. Tap CONNECT in Bio Buddy and approve the scopes.' };
  }

  const cov = await getCoverage('whoop');
  const today = new Date();
  const endYmd = today.toISOString().slice(0, 10);

  let start: Date;
  if (cov.lastDate) {
    // WHOOP revises a cycle after the fact, so the last two days are re-read.
    start = new Date(cov.lastDate + 'T00:00:00Z');
    start.setUTCDate(start.getUTCDate() - 2);
  } else {
    start = new Date(today.getTime());
    start.setUTCDate(start.getUTCDate() - 30);   // empty membrane: 30-day first fill
  }
  const startYmd = start.toISOString().slice(0, 10);

  try {
    const { rows, scope } = await fetchWhoopRange(startYmd, endYmd);
    if (!rows.length) {
      return { ok: false, days: 0, message: `WHOOP returned no nights between ${startYmd} and ${endYmd}.` };
    }
    const result = await upsertReadings(rows);
    if (result.ok) {
      logMembraneEvent({ eventType: 'device_sync', sourceScreen: 'biobuddy', subject: 'whoop', value: { days: result.days, lane: 'oauth' } });
      const extra = scope.napsSkipped ? ` ${scope.napsSkipped} nap(s) skipped — naps are not nights.` : '';
      return { ...result, message: `${result.message}${extra}` };
    }
    return result;
  } catch (e: any) {
    // WHOOP's own words, not a shrug.
    return { ok: false, days: 0, message: String(e?.message ?? e) };
  }
}

// ── STRAVA — cloud API sync (THE LEDGER LANE) ───────────────────────────────
/**
 * The catalog claimed "Strava API + activities.csv export (wired in-app)".
 * The audit of 2026-08-21 found only the CSV half existed. This is the API
 * half. Both lanes land on MILES so the two can be compared honestly.
 */
export async function syncStrava(): Promise<SyncResult> {
  const conn = await connectionFor('strava');
  if (!conn.connected) {
    return { ok: false, days: 0, message: 'Strava is not connected. Tap CONNECT in Bio Buddy and approve the scopes.' };
  }

  const cov = await getCoverage('strava');
  const today = new Date();
  const endYmd = today.toISOString().slice(0, 10);

  let start: Date;
  if (cov.lastDate) {
    start = new Date(cov.lastDate + 'T00:00:00Z');
    start.setUTCDate(start.getUTCDate() - 2);
  } else {
    start = new Date(today.getTime());
    start.setUTCDate(start.getUTCDate() - 90);   // activities are sparser than nights
  }
  const startYmd = start.toISOString().slice(0, 10);

  try {
    const pull = await fetchStravaRange(startYmd, endYmd);
    if (!pull.rows.length) {
      return { ok: false, days: 0, message: `Strava returned no activities with distance between ${startYmd} and ${endYmd}.` };
    }
    const result = await upsertReadings(pull.rows);
    if (result.ok) {
      logMembraneEvent({ eventType: 'device_sync', sourceScreen: 'biobuddy', subject: 'strava', value: { days: result.days, activities: pull.activities, lane: 'oauth' } });
      return { ...result, message: `${result.message} ${pull.activities} activit${pull.activities === 1 ? 'y' : 'ies'} read.` };
    }
    return result;
  } catch (e: any) {
    return { ok: false, days: 0, message: String(e?.message ?? e) };
  }
}

export async function importOuraExport(): Promise<SyncResult> {
  const picked = await DocumentPicker.getDocumentAsync({
    type: ['text/csv', 'text/comma-separated-values', 'text/*', '*/*'],
    multiple: true,
    copyToCacheDirectory: true,
  });
  if (picked.canceled || !picked.assets?.length) {
    return { ok: false, days: 0, message: 'Import cancelled.' };
  }

  try {
    const files: { name: string; text: string }[] = [];
    for (const a of picked.assets) {
      if (!/\.csv$/i.test(a.name ?? '')) continue;
      // temperature.csv and heartrate.csv are ~128k raw samples — a different
      // resolution of question, not day rows. Skipped by name before reading so
      // the phone never has to hold them in memory.
      if (/^(temperature|heartrate|rawlocation|sleep_?phase)/i.test(a.name ?? '')) continue;
      try {
        files.push({ name: a.name ?? 'unnamed.csv', text: await FileSystem.readAsStringAsync(a.uri) });
      } catch { /* one unreadable file must not sink the import */ }
    }
    if (!files.length) {
      return { ok: false, days: 0, message: 'No readable CSV files in that selection. Pick the files inside the Oura export\'s "App Data" folder.' };
    }

    const parsed = parseOuraExport(files);
    if (!parsed.nights.length) {
      return {
        ok: false, days: 0,
        message: `Read ${parsed.filesRead.length} file(s) but found no nights. sleepmodel.csv is the one that carries them — make sure it is in the selection.`,
      };
    }

    const result = await upsertReadings(parsed.nights.map(n => ({
      source: 'oura' as const,
      originSource: 'oura' as const,
      readingDate: n.reading_date,
      hrv: n.hrv_rmssd, sleep: n.sleep_score, readiness: n.readiness_score,
      activity: n.activity_score, stress: n.stress_level,
      bedtimeStart: n.bedtime_start, bedtimeEnd: n.bedtime_end,
      totalSleepMin: n.total_sleep_min, timeInBedMin: n.time_in_bed_min,
      deepMin: n.deep_min, remMin: n.rem_min, lightMin: n.light_min,
      awakeMin: n.awake_min, efficiencyPct: n.efficiency_pct,
      latencyMin: n.latency_min, restingHr: n.resting_hr,
      avgHr: n.avg_hr, minHr: n.min_hr, spo2Avg: n.spo2_avg,
      respirationAvg: n.respiration_avg, breathingIndex: n.breathing_index,
      skinTempDelta: n.skin_temp_delta, restlessMoments: n.restless_moments,
    })));

    if (result.ok) {
      logMembraneEvent({
        eventType: 'device_import', sourceScreen: 'biobuddy', subject: 'oura_export',
        value: { days: result.days, first: parsed.firstDate, last: parsed.lastDate },
      });
      // NO SILENT CAPS: say what was read, what was skipped, and how much of the
      // night actually arrived. A blank is a truthful blank, but it is never
      // reported as if it were a reading.
      const fields = countNightFields(parsed.nights);
      const skipped = parsed.filesIgnored.length
        ? ` Skipped ${parsed.filesIgnored.length} file(s) that hold raw samples rather than nights.`
        : '';
      return {
        ...result,
        message: `${result.message} ${parsed.nights.length} night(s) read from ${parsed.filesRead.length} file(s), ${parsed.firstDate} to ${parsed.lastDate} — ${fields} night measurements, not just scores.${skipped}`,
      };
    }
    return result;
  } catch (e: any) {
    return { ok: false, days: 0, message: `Could not read that Oura export. ${e?.message ?? ''}`.trim() };
  }
}

// ── WHOOP — ACCOUNT EXPORT · THE ARCHIVE LANE ───────────────────────────────
// physiological_cycles.csv is the file that matters: it is the ONLY row in the
// entire stack carrying SKIN TEMPERATURE and BLOOD OXYGEN on the same line as
// deep, REM and awake. Garmin has skin temp but gates SpO2 behind Pulse Ox
// being switched on. Oura has both, on separate endpoints.
//
// WHOOP's RECOVERY SCORE IS STORED BUT NEVER TRUSTED. On 2026-08-12 the
// founder's recovery fell nine points while his deep sleep rose 27% and his REM
// rose 24%. The vendor's verdict disagreed with the vendor's own inputs. It is
// written to the readiness column so it is visible, and the Clarifier is
// forbidden from treating it as ground truth.
export async function importWhoopExport(): Promise<SyncResult> {
  const picked = await DocumentPicker.getDocumentAsync({
    type: ['text/csv', 'text/comma-separated-values', 'text/*', '*/*'],
    multiple: true,
    copyToCacheDirectory: true,
  });
  if (picked.canceled || !picked.assets?.length) {
    return { ok: false, days: 0, message: 'Import cancelled.' };
  }

  try {
    const files: { name: string; text: string }[] = [];
    for (const a of picked.assets) {
      const nm = a.name ?? '';
      if (!/\.csv$/i.test(nm)) continue;
      // workouts.csv and journal_entries.csv are not night rows.
      if (!/(physiological_cycles|sleeps)/i.test(nm)) continue;
      try {
        files.push({ name: nm, text: await FileSystem.readAsStringAsync(a.uri) });
      } catch { /* one unreadable file must not sink the import */ }
    }
    if (!files.length) {
      return { ok: false, days: 0, message: 'No WHOOP night files in that selection. Pick physiological_cycles.csv — it carries the most.' };
    }

    const parsed = parseWhoopExport(files);
    if (!parsed.nights.length) {
      return { ok: false, days: 0, message: `Read ${parsed.filesRead.length} file(s) but found no nights.` };
    }

    const result = await upsertReadings(whoopRows(parsed.nights));
    if (result.ok) {
      logMembraneEvent({
        eventType: 'device_import', sourceScreen: 'biobuddy', subject: 'whoop_export',
        value: { days: result.days, first: parsed.firstDate, last: parsed.lastDate },
      });
      const naps = parsed.napsSkipped ? ` ${parsed.napsSkipped} nap(s) skipped — a nap is not a night.` : '';
      return {
        ...result,
        message: `${result.message} ${parsed.nights.length} night(s) read, ${parsed.firstDate} to ${parsed.lastDate}.${naps}`,
      };
    }
    return result;
  } catch (e: any) {
    return { ok: false, days: 0, message: `Could not read that WHOOP export. ${e?.message ?? ''}`.trim() };
  }
}

// ── GARMIN — official account export (JSON) ─────────────────────────────────
// Four files, read by name, parsed field by field in lib/garminImport.ts
// against the founder's own export. No heuristics. No scraping.
// ── harvestGarmin REMOVED 2026-08-21, LOGGED NOT ERASED ─────────────────────
// It was a blind recursive scraper that walked any Garmin JSON looking for
// field names it had GUESSED: sleepScores.overall.value, lastNightAvg,
// weeklyAvg, hrvValue, avgOvernightHrv, overallSleepScore.
//
// The founder's actual export, read on 2026-08-21, uses NONE of those paths.
// The real one is sleepScores.overallScore. So the scraper found almost
// nothing — and worse, `weeklyAvg` is a WEEKLY average. Had it matched, it
// would have written a week's number into a night's HRV column and the
// membrane would have compared a week against a night and called it a
// disagreement.
//
// GUESSING WILL NOT BE TOLERATED. lib/garminImport.ts replaces it, written
// against the real files, field by field.
// ────────────────────────────────────────────────────────────────────────────

export async function importGarminExport(): Promise<SyncResult> {
  // FOUNDER ORDER 2026-08-21: "Fresh GARMIN add that!!!!!!"
  // Garmin ships a ZIP with ~100 files. The four that carry a night are named
  // below; the member unzips once and picks them, the same way the WHOOP CSVs
  // are picked. Multi-select, because one night lives across four files:
  //   *_sleepData.json        the night
  //   UDSFile_*.json          the day
  //   *_healthStatusData.json HRV + the SKIN TEMP DELTA nobody else ships
  //   *_fitnessAgeData.json   VO2 max, marked as the estimate it is
  const picked = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/*', '*/*'],
    multiple: true,
    copyToCacheDirectory: true,
  });
  if (picked.canceled || !picked.assets?.length) {
    return { ok: false, days: 0, message: 'Import cancelled.' };
  }

  try {
    const files: GarminFile[] = [];
    const ignored: string[] = [];
    for (const a of picked.assets) {
      const nm = a.name ?? '';
      if (!GARMIN_NIGHT_FILES.test(nm)) { ignored.push(nm); continue; }
      try {
        files.push({ name: nm, text: await FileSystem.readAsStringAsync(a.uri) });
      } catch { /* one unreadable file must not sink the import */ }
    }
    if (!files.length) {
      return {
        ok: false, days: 0,
        message: 'No Garmin night files in that selection. Unzip the export and pick the files named sleepData, UDSFile, healthStatusData and fitnessAgeData — they live in DI_CONNECT/DI-Connect-Wellness and DI-Connect-Aggregator.',
      };
    }

    const parsed = parseGarminExport(files);
    if (!parsed.rows.length) {
      return { ok: false, days: 0, message: `Read ${parsed.filesRead.length} file(s) but found no days.` };
    }

    const result = await upsertReadings(parsed.rows);
    if (result.ok) {
      logMembraneEvent({
        eventType: 'device_import', sourceScreen: 'biobuddy', subject: 'garmin',
        value: {
          days: result.days, fieldValues: parsed.fieldValues,
          sleepRecords: parsed.sleepRecords, napsSkipped: parsed.napsSkipped,
          first: parsed.firstDate, last: parsed.lastDate,
        },
      });
      // NOTHING IS SILENTLY DROPPED. The member is told what was read, what was
      // skipped, and that naps were seen and kept out of the nights.
      const naps = parsed.napsSkipped ? ` ${parsed.napsSkipped} nap(s) seen and kept out of the nights.` : '';
      const skip = ignored.length ? ` ${ignored.length} file(s) in that selection are not night files and were not read.` : '';
      return {
        ...result,
        message: `${result.message} ${parsed.fieldValues} field values across ${parsed.firstDate} → ${parsed.lastDate}.${naps}${skip}`,
      };
    }
    return result;
  } catch (e: any) {
    return { ok: false, days: 0, message: `Could not read that Garmin export. ${e?.message ?? ''}`.trim() };
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
      .select(NIGHT_COLUMNS)
      .eq('member_id', user.id)
      .order('reading_date', { ascending: false })
      .limit(400);
    if (error || !data?.length) return empty;

    // Group by day; find the newest day carrying 2+ sources.
    const byDay = new Map<string, any[]>();
    for (const r of (data as any[])) {
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

/* ─── THE ROOM ────────────────────────────────────────────────────────────────
 *
 * FOUNDER ORDER, 2026-08-22:
 *   "you get the ozlo wired right so the temp can be shown that it comes up
 *    with."
 *
 * ⚠ WHAT IS WIRED AND WHAT IS NOT — SAID PLAINLY.
 *
 * The CHANNEL is wired: the column, the source, the reader, the display. A room
 * temperature can be written, stored, read back and shown beside the body.
 *
 * The PIPE is not wired, and it is not going to be claimed. The Ozlo Sleepbuds 2
 * and Smart Case ship 2026-08-24. No export path, no API and no manual has been
 * read. NEVER STATE A DEVICE CAPABILITY WITHOUT THE RECEIPT — so until there is
 * one, a room reading arrives the way every honest first reading arrives: by
 * hand, marked as entered by hand. The day a pipe is proven, it writes to these
 * same columns and nothing above it changes.
 *
 * WHY THIS EXISTS AT ALL — the one question the stack could not answer:
 *
 *   GARMIN skin_temp_delta is ALREADY a deviation from his own baseline.
 *   OZLO   room_temp_c    is an ABSOLUTE fact about the room.
 *
 *     skin moves + room holds -> THE MASK did it
 *     skin moves + room moves -> THE ROOM did it
 *
 * Neither channel can separate those alone. Both together can. That is the
 * whole reason this file grew.
 */

export type RoomNight = {
  date: string;
  roomTempC: number | null;
  roomLight: number | null;
  roomNoiseDb: number | null;
  /** From GARMIN, same night. Already a delta from his OWN baseline. */
  skinTempDelta: number | null;
};

/** Write one night's room. `source` stays 'ozlo' even when entered by hand —
 *  the instrument is the instrument. `origin_source` is what tells the truth
 *  about how it arrived: 'manual' until a pipe is proven. */
export async function saveRoomReading(input: {
  date: string;                 // YYYY-MM-DD — the night, not the morning
  tempC?: number | null;
  light?: number | null;
  noiseDb?: number | null;
  byHand?: boolean;             // default true until an Ozlo pipe exists
}): Promise<SyncResult> {
  const byHand = input.byHand !== false;
  return upsertReadings([{
    source: 'ozlo',
    originSource: byHand ? 'manual' : 'ozlo',
    readingDate: input.date,
    roomTempC:   input.tempC ?? null,
    roomLight:   input.light ?? null,
    roomNoiseDb: input.noiseDb ?? null,
  }]);
}

/**
 * The room and the body, night by night, already lined up.
 *
 * The join is BY NIGHT and by nothing else. Room temperature comes from the
 * Ozlo row; skin temperature delta comes from whichever body instrument
 * recorded one — Garmin today. They are kept in separate columns of the same
 * night rather than merged, because THEY ARE NOT THE SAME MEASUREMENT and the
 * membrane must never report a room as if it were a body.
 */
export async function readTheRoom(days = 30): Promise<RoomNight[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const since = new Date(Date.now() - days * 86400000).toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('biosignal_readings')
      .select('source, reading_date, room_temp_c, room_light, room_noise_db, skin_temp_delta')
      .eq('member_id', user.id)
      .gte('reading_date', since)
      .order('reading_date', { ascending: true });
    if (error || !data) return [];

    const byNight = new Map<string, RoomNight>();
    for (const r of data as any[]) {
      const d = r.reading_date as string;
      const night = byNight.get(d) ?? { date: d, roomTempC: null, roomLight: null, roomNoiseDb: null, skinTempDelta: null };
      // The room only ever comes from the instrument that measures the room.
      if (r.source === 'ozlo') {
        if (r.room_temp_c    != null) night.roomTempC   = Number(r.room_temp_c);
        if (r.room_light     != null) night.roomLight   = Number(r.room_light);
        if (r.room_noise_db  != null) night.roomNoiseDb = Number(r.room_noise_db);
      }
      // The body delta comes from a body instrument. An Ozlo row never supplies it.
      if (r.source !== 'ozlo' && r.skin_temp_delta != null) night.skinTempDelta = Number(r.skin_temp_delta);
      byNight.set(d, night);
    }
    return [...byNight.values()].filter(n =>
      n.roomTempC != null || n.roomLight != null || n.roomNoiseDb != null || n.skinTempDelta != null);
  } catch { return []; }
}

/**
 * THE SEPARATION. One night in, one sentence out — and it refuses to speak when
 * it cannot tell the two apart.
 *
 * NO NAKED NUMBERS: never returns a bare figure. ZERO SHAME: never a verdict on
 * the member. It reports which of two things moved, or that it cannot say.
 */
export function separateRoomFromBody(
  night: RoomNight,
  roomBaselineC: number | null,
): { line: string; confident: boolean } {
  const { roomTempC, skinTempDelta } = night;
  if (skinTempDelta == null) {
    return { line: 'No skin temperature on this night, so there is nothing to separate yet.', confident: false };
  }
  if (roomTempC == null) {
    return {
      line: `Your skin ran ${skinTempDelta > 0 ? 'warmer' : 'cooler'} than your own baseline, but the room was not measured — so this cannot tell you whether it was you or the bedroom. That is exactly the gap the Ozlo case closes.`,
      confident: false,
    };
  }
  if (roomBaselineC == null) {
    return {
      line: `Room ${roomTempC.toFixed(1)}°C on record. One night is not a room baseline — a few more and the room can be held constant while the mask changes.`,
      confident: false,
    };
  }
  const roomMoved = Math.abs(roomTempC - roomBaselineC) >= 1.0;
  const skinMoved = Math.abs(skinTempDelta) >= 0.3;
  if (!skinMoved) return { line: 'Skin temperature sat inside your ordinary range. Nothing to attribute.', confident: true };
  if (roomMoved) {
    return {
      line: `Both moved — skin ${skinTempDelta > 0 ? 'up' : 'down'} against your baseline and the room ${roomTempC > roomBaselineC ? 'warmer' : 'cooler'} than its own. The room is the simpler explanation, so this night cannot be credited to what was on your face.`,
      confident: true,
    };
  }
  return {
    line: `Skin ${skinTempDelta > 0 ? 'warmer' : 'cooler'} than your baseline while the room held at its own. The room did not do this one.`,
    confident: true,
  };
}
