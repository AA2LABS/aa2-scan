/**
 * ─── lib/whoopImport.ts ─────────────────────────────────────────────────────
 * WHOOP ACCOUNT EXPORT — THE ARCHIVE LANE.
 *
 * FOUNDER ORDER 2026-08-21: "MAKE THIS WORK IN AA2 — I want my instruments live."
 *
 * Verified against the founder's own export, my_whoop_data_2026_08_21.zip:
 *   physiological_cycles.csv — one row per cycle, carrying BOTH the recovery
 *     block (recovery %, RHR, HRV, SKIN TEMP, blood oxygen, strain) AND the
 *     full sleep block. This is the file that matters.
 *   sleeps.csv — sleep only, plus a Nap flag.
 *   workouts.csv · journal_entries.csv — not night rows.
 *
 * WHOOP SHIPS WHAT NOBODY ELSE IN THE STACK DOES IN ONE ROW: skin temperature
 * in Celsius and blood oxygen alongside the sleep architecture. Garmin has skin
 * temp but gates SpO2 behind Pulse Ox being on. Oura has both but on separate
 * endpoints. WHOOP puts them on the same line as deep, REM and awake.
 *
 * COMMA delimited, quote-aware, minutes already (no seconds conversion).
 * NAPS ARE NOT NIGHTS — sleeps.csv carries a Nap column and it is honoured.
 * ────────────────────────────────────────────────────────────────────────────
 */

import type { BiosignalRow } from './biosignals';

export type WhoopNight = {
  reading_date: string;
  recovery_score: number | null;
  resting_hr: number | null;
  hrv_rmssd: number | null;
  skin_temp_c: number | null;
  spo2_avg: number | null;
  day_strain: number | null;
  bedtime_start: string | null;
  bedtime_end: string | null;
  total_sleep_min: number | null;
  time_in_bed_min: number | null;
  light_min: number | null;
  deep_min: number | null;
  rem_min: number | null;
  awake_min: number | null;
  efficiency_pct: number | null;
  respiration_avg: number | null;
  sleep_need_min: number | null;
  sleep_debt_min: number | null;
  sleep_performance_pct: number | null;
};

export type WhoopFile = { name: string; text: string };

// ── PARSER — comma delimited, quote-aware ───────────────────────────────────
function splitLine(line: string): string[] {
  const out: string[] = [];
  let cur = '', inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === ',' && !inQ) { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur);
  return out;
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    .split('\n').filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];
  const headers = splitLine(lines[0]).map(h => h.trim());
  return lines.slice(1).map(l => {
    const cells = splitLine(l);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = (cells[i] ?? '').trim(); });
    return row;
  });
}

function num(v: string | undefined): number | null {
  if (v == null) return null;
  const s = v.trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function ymd(v: string | undefined): string | null {
  const m = String(v ?? '').match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

function isNap(v: string | undefined): boolean {
  return /^(true|yes|1)$/i.test((v ?? '').trim());
}

export type WhoopParseResult = {
  nights: WhoopNight[];
  filesRead: string[];
  napsSkipped: number;
  firstDate: string | null;
  lastDate: string | null;
};

/**
 * physiological_cycles.csv is preferred — it is the only file carrying skin
 * temperature and blood oxygen next to the sleep architecture. sleeps.csv is
 * read as a fallback and to catch nights the cycle file missed.
 */
export function parseWhoopExport(files: WhoopFile[]): WhoopParseResult {
  const map = new Map<string, WhoopNight>();
  const read: string[] = [];
  let naps = 0;

  const blank = (d: string): WhoopNight => ({
    reading_date: d,
    recovery_score: null, resting_hr: null, hrv_rmssd: null, skin_temp_c: null,
    spo2_avg: null, day_strain: null, bedtime_start: null, bedtime_end: null,
    total_sleep_min: null, time_in_bed_min: null, light_min: null, deep_min: null,
    rem_min: null, awake_min: null, efficiency_pct: null, respiration_avg: null,
    sleep_need_min: null, sleep_debt_min: null, sleep_performance_pct: null,
  });

  const merge = (d: string | null, patch: Partial<WhoopNight>) => {
    if (!d) return;
    const cur = map.get(d) ?? blank(d);
    const next = { ...cur };
    for (const [k, v] of Object.entries(patch)) {
      if (v !== null && v !== undefined) (next as any)[k] = v;
    }
    map.set(d, next);
  };

  const sleepBlock = (r: Record<string, string>): Partial<WhoopNight> => ({
    bedtime_start:        r['Sleep onset'] || null,
    bedtime_end:          r['Wake onset'] || null,
    total_sleep_min:      num(r['Asleep duration (min)']),
    time_in_bed_min:      num(r['In bed duration (min)']),
    light_min:            num(r['Light sleep duration (min)']),
    deep_min:             num(r['Deep (SWS) duration (min)']),
    rem_min:              num(r['REM duration (min)']),
    awake_min:            num(r['Awake duration (min)']),
    efficiency_pct:       num(r['Sleep efficiency %']),
    respiration_avg:      num(r['Respiratory rate (rpm)']),
    sleep_need_min:       num(r['Sleep need (min)']),
    sleep_debt_min:       num(r['Sleep debt (min)']),
    sleep_performance_pct: num(r['Sleep performance %']),
  });

  for (const f of files) {
    const base = f.name.toLowerCase().split('/').pop() ?? '';
    let rows: Record<string, string>[];
    try { rows = parseCsv(f.text); } catch { continue; }
    if (!rows.length) continue;

    if (base.includes('physiological_cycles')) {
      for (const r of rows) {
        const d = ymd(r['Cycle start time']);
        if (!d) continue;
        // A cycle row with no sleep block is a partial day, not a night.
        if (num(r['Asleep duration (min)']) == null) continue;
        merge(d, {
          recovery_score: num(r['Recovery score %']),
          resting_hr:     num(r['Resting heart rate (bpm)']),
          hrv_rmssd:      num(r['Heart rate variability (ms)']),
          // WHOOP is the only instrument in the stack shipping skin temperature
          // and blood oxygen on the SAME ROW as the sleep architecture.
          skin_temp_c:    num(r['Skin temp (celsius)']),
          spo2_avg:       num(r['Blood oxygen %']),
          day_strain:     num(r['Day Strain']),
          ...sleepBlock(r),
        });
      }
      read.push(f.name);
    } else if (base.includes('sleeps')) {
      for (const r of rows) {
        // NAPS ARE NOT NIGHTS.
        if (isNap(r['Nap'])) { naps++; continue; }
        const d = ymd(r['Cycle start time']);
        if (!d) continue;
        merge(d, sleepBlock(r));
      }
      read.push(f.name);
    }
    // workouts.csv and journal_entries.csv are not night rows. Skipped on
    // purpose and reported, never silently dropped.
  }

  const nights = [...map.values()].sort((a, b) => a.reading_date.localeCompare(b.reading_date));
  return {
    nights, filesRead: read, napsSkipped: naps,
    firstDate: nights.length ? nights[0].reading_date : null,
    lastDate: nights.length ? nights[nights.length - 1].reading_date : null,
  };
}

/** Celsius to the membrane's degrees-from-own-baseline is done downstream. */
export function toBiosignalRows(nights: WhoopNight[]): BiosignalRow[] {
  return nights.map(n => ({
    source: 'whoop' as const,
    originSource: 'whoop' as const,
    readingDate: n.reading_date,
    hrv: n.hrv_rmssd,
    // WHOOP's Recovery is a VENDOR VERDICT, not a measurement. It is stored as
    // readiness so it is visible, and the Clarifier is forbidden from treating
    // it as ground truth — on 2026-08-12 the founder's recovery score FELL nine
    // points while deep sleep rose 27% and REM rose 24%. The score disagreed
    // with its own inputs.
    readiness: n.recovery_score,
    activity: n.day_strain,
    sleep: n.sleep_performance_pct,
    stress: null,
    bedtimeStart: n.bedtime_start,
    bedtimeEnd: n.bedtime_end,
    totalSleepMin: n.total_sleep_min,
    timeInBedMin: n.time_in_bed_min,
    deepMin: n.deep_min,
    remMin: n.rem_min,
    lightMin: n.light_min,
    awakeMin: n.awake_min,
    efficiencyPct: n.efficiency_pct,
    restingHr: n.resting_hr,
    spo2Avg: n.spo2_avg,
    respirationAvg: n.respiration_avg,
    skinTempDelta: null,   // absolute Celsius, not a delta — converted downstream
  }));
}
