/**
 * ─── lib/ouraSync.ts ────────────────────────────────────────────────────────
 * Oura Cloud API v2 — THE FULL NIGHT.
 * https://cloud.ouraring.com/v2/docs
 *
 * FOUNDER ORDER 2026-08-21: "I'm not doing this shit every day. I want this
 * working today collecting my real data."
 *
 * This file used to ask Oura for five numbers — sleep score, readiness score,
 * activity score, average HRV, stress. Oura was already returning the entire
 * night and being ignored: deep, REM, light, awake, efficiency, latency,
 * resting and lowest heart rate, respiration, SpO2, temperature deviation,
 * restless periods, and both ends of the sleep window.
 *
 * Every number the founder screenshotted by hand on the night of 2026-08-20 is
 * in this API. None of it was being asked for. That is now fixed.
 *
 * LANE: LEDGER (cloud API). Runs over plain HTTPS — no native build required,
 * ships on OTA. Token lives in device_connections.oura_token; it never leaves
 * the member's own database.
 * ────────────────────────────────────────────────────────────────────────────
 */

const OURA = 'https://api.ouraring.com/v2/usercollection';

/** One member-day, assembled from every Oura endpoint that speaks about it. */
export type OuraDailyRow = {
  reading_date: string;

  // ── scores (what Oura thinks) ──
  hrv_rmssd: number | null;
  sleep_score: number | null;
  readiness_score: number | null;
  activity_score: number | null;
  stress_level: number | null;

  // ── the window (bedtime is the unsolved measurement) ──
  bedtime_start: string | null;
  bedtime_end: string | null;

  // ── architecture (what actually happened) ──
  total_sleep_min: number | null;
  time_in_bed_min: number | null;
  deep_min: number | null;
  rem_min: number | null;
  light_min: number | null;
  awake_min: number | null;
  efficiency_pct: number | null;
  latency_min: number | null;

  // ── cardiac ──
  resting_hr: number | null;
  avg_hr: number | null;
  min_hr: number | null;

  // ── respiratory ──
  spo2_avg: number | null;
  respiration_avg: number | null;
  breathing_index: number | null;

  // ── thermal — deviation from the MEMBER'S OWN baseline, never a population ──
  skin_temp_delta: number | null;

  // ── movement — restless periods are NOT awakenings ──
  restless_moments: number | null;
};

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Oura reports durations in seconds. The membrane stores minutes. */
function secToMin(s: unknown): number | null {
  if (typeof s !== 'number' || !Number.isFinite(s)) return null;
  return Math.round(s / 60);
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

async function fetchOura<T>(
  path: string,
  token: string,
  query: Record<string, string>
): Promise<T> {
  const q = new URLSearchParams(query).toString();
  const url = `${OURA}/${path}?${q}`;
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${token.trim()}`, Accept: 'application/json' },
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Oura ${path} ${r.status}: ${t.slice(0, 200)}`);
  }
  return r.json() as Promise<T>;
}

/** Endpoints a plain Personal Access Token may not reach are not fatal. */
async function softFetch<T>(
  path: string,
  token: string,
  query: Record<string, string>
): Promise<T | null> {
  try {
    return await fetchOura<T>(path, token, query);
  } catch (e) {
    console.log('[ouraSync] skipped', path, String((e as Error)?.message ?? e).slice(0, 120));
    return null;
  }
}

/** GET personal_info — works with a valid PAT (no extra scopes). */
export async function validateOuraToken(token: string): Promise<boolean> {
  try {
    const r = await fetch(`${OURA}/personal_info`, {
      headers: { Authorization: `Bearer ${token.trim()}`, Accept: 'application/json' },
    });
    return r.ok;
  } catch {
    return false;
  }
}

type ListResp<T> = { data?: T[] };

/** The full sleep-session object Oura v2 returns. Durations in seconds. */
type OuraSleepSession = {
  day?: string;
  type?: string;                    // 'long_sleep' | 'sleep' | 'late_nap' | 'rest' | 'deleted'
  bedtime_start?: string;
  bedtime_end?: string;
  total_sleep_duration?: number;
  time_in_bed?: number;
  deep_sleep_duration?: number;
  rem_sleep_duration?: number;
  light_sleep_duration?: number;
  awake_time?: number;
  efficiency?: number;
  latency?: number;
  average_heart_rate?: number;
  lowest_heart_rate?: number;
  average_hrv?: number;
  average_breath?: number;
  restless_periods?: number;
  readiness?: { temperature_deviation?: number | null };
};

function blankDay(day: string): OuraDailyRow {
  return {
    reading_date: day,
    hrv_rmssd: null, sleep_score: null, readiness_score: null,
    activity_score: null, stress_level: null,
    bedtime_start: null, bedtime_end: null,
    total_sleep_min: null, time_in_bed_min: null,
    deep_min: null, rem_min: null, light_min: null, awake_min: null,
    efficiency_pct: null, latency_min: null,
    resting_hr: null, avg_hr: null, min_hr: null,
    spo2_avg: null, respiration_avg: null, breathing_index: null,
    skin_temp_delta: null, restless_moments: null,
  };
}

function mergeDay(
  map: Map<string, OuraDailyRow>,
  day: string | undefined,
  patch: Partial<Omit<OuraDailyRow, 'reading_date'>>
) {
  if (!day) return;
  const cur = map.get(day) ?? blankDay(day);
  // Never overwrite a real value with a null — endpoints arrive out of order.
  const next = { ...cur };
  for (const [k, v] of Object.entries(patch)) {
    if (v !== null && v !== undefined) (next as any)[k] = v;
  }
  map.set(day, next);
}

/**
 * THE MAIN SLEEP OF A NIGHT — not a nap, not a rest period.
 * Oura may return several sessions for one day. 'long_sleep' is the night;
 * if the label is absent, the longest session wins. Naps are not the night.
 */
function pickMainSleep(sessions: OuraSleepSession[]): OuraSleepSession | null {
  const live = sessions.filter(s => s.type !== 'deleted');
  if (!live.length) return null;
  const long = live.filter(s => s.type === 'long_sleep');
  const pool = long.length ? long : live;
  return pool.reduce((best, s) =>
    (s.total_sleep_duration ?? 0) > (best.total_sleep_duration ?? 0) ? s : best
  );
}

export async function fetchOuraLast30Days(
  token: string,
  startYmd?: string,
  endYmd?: string,
): Promise<OuraDailyRow[]> {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  const sd = startYmd ?? ymd(start);
  const ed = endYmd ?? ymd(end);
  const q = { start_date: sd, end_date: ed };
  const t = token.trim();

  const [readiness, dailySleep, activity, sleepSessions, stress, spo2] = await Promise.all([
    softFetch<ListResp<{ day?: string; score?: number; temperature_deviation?: number | null }>>('daily_readiness', t, q),
    softFetch<ListResp<{ day?: string; score?: number }>>('daily_sleep', t, q),
    softFetch<ListResp<{ day?: string; score?: number }>>('daily_activity', t, q),
    softFetch<ListResp<OuraSleepSession>>('sleep', t, q),
    softFetch<ListResp<{ day?: string; stress_high?: number }>>('daily_stress', t, q),
    softFetch<ListResp<{ day?: string; spo2_percentage?: { average?: number }; breathing_disturbance_index?: number }>>('daily_spo2', t, q),
  ]);

  const map = new Map<string, OuraDailyRow>();

  for (const d of readiness?.data ?? []) {
    mergeDay(map, d.day, {
      readiness_score: num(d.score),
      // Deviation from the member's OWN baseline. This is the channel that
      // corroborated "the room was cold as hell" on 2026-08-20.
      skin_temp_delta: num(d.temperature_deviation),
    });
  }

  for (const d of dailySleep?.data ?? []) {
    mergeDay(map, d.day, { sleep_score: num(d.score) });
  }

  for (const d of activity?.data ?? []) {
    mergeDay(map, d.day, { activity_score: num(d.score) });
  }

  for (const d of stress?.data ?? []) {
    mergeDay(map, d.day, { stress_level: num(d.stress_high) });
  }

  for (const d of spo2?.data ?? []) {
    mergeDay(map, d.day, {
      spo2_avg: num(d.spo2_percentage?.average),
      breathing_index: num(d.breathing_disturbance_index),
    });
  }

  // ── THE NIGHT ITSELF ──────────────────────────────────────────────────────
  // Group sessions by day, then take the main sleep. This is the block the
  // previous version threw away, and it holds every field the founder's stack
  // actually disagreed about.
  const byDay = new Map<string, OuraSleepSession[]>();
  for (const s of sleepSessions?.data ?? []) {
    if (!s.day) continue;
    const arr = byDay.get(s.day) ?? [];
    arr.push(s);
    byDay.set(s.day, arr);
  }

  for (const [day, sessions] of byDay) {
    const s = pickMainSleep(sessions);
    if (!s) continue;
    mergeDay(map, day, {
      hrv_rmssd:        num(s.average_hrv),
      bedtime_start:    s.bedtime_start ?? null,
      bedtime_end:      s.bedtime_end ?? null,
      total_sleep_min:  secToMin(s.total_sleep_duration),
      time_in_bed_min:  secToMin(s.time_in_bed),
      deep_min:         secToMin(s.deep_sleep_duration),
      rem_min:          secToMin(s.rem_sleep_duration),
      light_min:        secToMin(s.light_sleep_duration),
      awake_min:        secToMin(s.awake_time),
      efficiency_pct:   num(s.efficiency),
      latency_min:      secToMin(s.latency),
      avg_hr:           num(s.average_heart_rate),
      min_hr:           num(s.lowest_heart_rate),
      // Oura's lowest overnight heart rate IS its resting heart rate figure.
      resting_hr:       num(s.lowest_heart_rate),
      respiration_avg:  num(s.average_breath),
      // RESTLESS PERIODS ARE NOT AWAKENINGS. Kept in its own column so the
      // membrane never reports two answers to one question as a disagreement.
      restless_moments: num(s.restless_periods),
      skin_temp_delta:  num(s.readiness?.temperature_deviation),
    });
  }

  return [...map.values()].sort((a, b) => a.reading_date.localeCompare(b.reading_date));
}

export function computeOuraBaselines(rows: OuraDailyRow[]): {
  hrv_baseline_30d: number | null;
  readiness_baseline_30d: number | null;
} {
  const hrvs = rows.map(r => r.hrv_rmssd).filter((x): x is number => x != null && !Number.isNaN(x));
  const rdy = rows
    .map(r => r.readiness_score)
    .filter((x): x is number => x != null && !Number.isNaN(x));
  const hrv_baseline_30d = hrvs.length
    ? Math.round((hrvs.reduce((a, b) => a + b, 0) / hrvs.length) * 1000) / 1000
    : null;
  const readiness_baseline_30d = rdy.length
    ? Math.round((rdy.reduce((a, b) => a + b, 0) / rdy.length) * 1000) / 1000
    : null;
  return { hrv_baseline_30d, readiness_baseline_30d };
}

/** How many of the night's fields actually arrived — for honest sync reporting. */
export function countNightFields(rows: OuraDailyRow[]): number {
  const keys: (keyof OuraDailyRow)[] = [
    'deep_min', 'rem_min', 'light_min', 'awake_min', 'efficiency_pct',
    'latency_min', 'resting_hr', 'spo2_avg', 'skin_temp_delta',
    'respiration_avg', 'restless_moments', 'bedtime_start',
  ];
  let n = 0;
  for (const r of rows) for (const k of keys) if (r[k] != null) n++;
  return n;
}
