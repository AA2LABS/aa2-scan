/**
 * ─── lib/ouraExport.ts ──────────────────────────────────────────────────────
 * OURA ACCOUNT EXPORT — THE ARCHIVE LANE.
 *
 * FOUNDER FINDING 2026-08-21. The Personal Access Token created 2026-04-02 is
 * masked and unrecoverable, and Oura has stopped issuing new ones. The LEDGER
 * lane is closed until OAuth2 is built.
 *
 * NOTHING IS MISSING. A complete Oura account export was already sitting on the
 * founder's own disk, dated 2026-06-04 — 90 verified nights (parsed and counted, not assumed), 2025-12-31 through
 * 2026-03-30 — and it carries EXACTLY the columns the FULL NIGHT migration
 * created, under EXACTLY the same names the cloud API uses:
 *
 *   deep_sleep_duration · rem_sleep_duration · light_sleep_duration ·
 *   awake_time · efficiency · latency · time_in_bed · total_sleep_duration ·
 *   bedtime_start · bedtime_end · average_heart_rate · lowest_heart_rate ·
 *   average_hrv · average_breath · restless_periods · type
 *
 * One parser therefore serves both lanes. When OAuth lands, the API path fills
 * forward from where the archive stops and nothing has to be rewritten.
 *
 * THE THREE LATENCIES (locked): LIVE (BLE) · LEDGER (cloud API) · ARCHIVE
 * (export files). This file is the ARCHIVE, and the junk drawer is the onramp.
 *
 * FORMAT NOTES — measured against the founder's own export, not assumed:
 *   · SEMICOLON delimited, not comma.
 *   · Several columns carry embedded JSON in doubled quotes ("{""average"": 94})
 *     so a naive split is not safe. The parser below is quote-aware.
 *   · Durations are SECONDS. The membrane stores minutes.
 *   · sleepmodel.csv holds naps AND nights. type='long_sleep' is the night.
 *   · vo2max.csv shipped EMPTY — Oura never produced one for this member. A
 *     blank is a truthful blank; nothing is invented to fill it.
 * ────────────────────────────────────────────────────────────────────────────
 */

export type OuraExportNight = {
  reading_date: string;
  hrv_rmssd: number | null;
  sleep_score: number | null;
  readiness_score: number | null;
  activity_score: number | null;
  stress_level: number | null;
  bedtime_start: string | null;
  bedtime_end: string | null;
  total_sleep_min: number | null;
  time_in_bed_min: number | null;
  deep_min: number | null;
  rem_min: number | null;
  light_min: number | null;
  awake_min: number | null;
  efficiency_pct: number | null;
  latency_min: number | null;
  resting_hr: number | null;
  avg_hr: number | null;
  min_hr: number | null;
  spo2_avg: number | null;
  respiration_avg: number | null;
  breathing_index: number | null;
  skin_temp_delta: number | null;
  restless_moments: number | null;
};

export type OuraExportFile = { name: string; text: string };

// ── PARSER ───────────────────────────────────────────────────────────────────
// Quote-aware, delimiter-agnostic. Oura ships semicolons and embeds JSON with
// doubled quotes inside fields; splitting on the delimiter alone corrupts rows.
function splitLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === delim && !inQ) {
      out.push(cur); cur = '';
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

/** Rows keyed by header name. Detects ';' vs ',' from the header row. */
export function parseDelimited(text: string): Record<string, string>[] {
  const clean = text.replace(/^﻿/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = clean.split('\n').filter(l => l.trim().length > 0);
  if (lines.length < 2) return [];

  const delim = (lines[0].match(/;/g)?.length ?? 0) >= (lines[0].match(/,/g)?.length ?? 0) ? ';' : ',';
  const headers = splitLine(lines[0], delim).map(h => h.trim());

  // A field carrying embedded JSON can span physical lines. Re-join any line
  // that came back short — the row is not finished until the columns match.
  const rows: Record<string, string>[] = [];
  let buf = '';
  for (let i = 1; i < lines.length; i++) {
    buf = buf ? buf + '\n' + lines[i] : lines[i];
    const cells = splitLine(buf, delim);
    if (cells.length < headers.length && i < lines.length - 1) continue;
    const row: Record<string, string> = {};
    headers.forEach((h, j) => { row[h] = (cells[j] ?? '').trim(); });
    rows.push(row);
    buf = '';
  }
  return rows;
}

function num(v: string | undefined): number | null {
  if (v == null) return null;
  const s = v.trim();
  if (!s || s.toLowerCase() === 'null' || s.toLowerCase() === 'none') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function secToMin(v: string | undefined): number | null {
  const n = num(v);
  return n == null ? null : Math.round(n / 60);
}

function ymd(v: string | undefined): string | null {
  const m = String(v ?? '').match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

/** Pulls one number out of an embedded JSON blob, e.g. {"average": 93.949}. */
function jsonNum(blob: string | undefined, key: string): number | null {
  if (!blob) return null;
  try {
    const o = JSON.parse(blob) as Record<string, unknown>;
    const v = o[key];
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  } catch {
    const m = blob.match(new RegExp('"' + key + '"\\s*:\\s*(-?[0-9.]+)'));
    return m ? Number(m[1]) : null;
  }
}

function blank(day: string): OuraExportNight {
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

function merge(
  map: Map<string, OuraExportNight>,
  day: string | null,
  patch: Partial<Omit<OuraExportNight, 'reading_date'>>
) {
  if (!day) return;
  const cur = map.get(day) ?? blank(day);
  const next = { ...cur };
  for (const [k, v] of Object.entries(patch)) {
    if (v !== null && v !== undefined) (next as any)[k] = v;
  }
  map.set(day, next);
}

/**
 * THE MAIN SLEEP OF A NIGHT — not a nap. The founder's own export carries
 * type='sleep' rows as short as 210 seconds alongside the real night. A nap is
 * not a night and must never be written as one.
 */
const MIN_NIGHT_SEC = 3 * 3600;   // three hours

function pickMainSleep(rows: Record<string, string>[]): Record<string, string> | null {
  const live = rows.filter(r => (r.type ?? '').toLowerCase() !== 'deleted');
  if (!live.length) return null;
  const long = live.filter(r => (r.type ?? '').toLowerCase() === 'long_sleep');
  if (long.length) {
    return long.reduce((best, r) =>
      (num(r.total_sleep_duration) ?? 0) > (num(best.total_sleep_duration) ?? 0) ? r : best
    );
  }
  // NO LONG SLEEP THAT DAY. Fall back to the longest session ONLY if it is
  // plausibly a night. Verified against the founder's own export: 2025-12-31
  // carries a single 720-second session and nothing else. Twelve minutes is not
  // a night, and writing it as one would poison every baseline downstream.
  const best = live.reduce((a2, r) =>
    (num(r.total_sleep_duration) ?? 0) > (num(a2.total_sleep_duration) ?? 0) ? r : a2
  );
  return (num(best.total_sleep_duration) ?? 0) >= MIN_NIGHT_SEC ? best : null;
}

function baseName(name: string): string {
  return name.toLowerCase().split('/').pop()!.replace(/\.csv$/, '');
}

export type OuraExportResult = {
  nights: OuraExportNight[];
  filesRead: string[];
  filesIgnored: string[];
  firstDate: string | null;
  lastDate: string | null;
};

/**
 * Reads any subset of an Oura account export. Every file is optional — hand it
 * only sleepmodel.csv and it still produces full nights; hand it everything and
 * the scores, SpO2 and temperature deviation ride along.
 */
export function parseOuraExport(files: OuraExportFile[]): OuraExportResult {
  const map = new Map<string, OuraExportNight>();
  const read: string[] = [];
  const ignored: string[] = [];

  for (const f of files) {
    const kind = baseName(f.name);
    let rows: Record<string, string>[];
    try { rows = parseDelimited(f.text); } catch { ignored.push(f.name); continue; }
    if (!rows.length) { ignored.push(f.name); continue; }

    switch (kind) {
      // ── THE NIGHT ──
      case 'sleepmodel': {
        const byDay = new Map<string, Record<string, string>[]>();
        for (const r of rows) {
          const d = ymd(r.day);
          if (!d) continue;
          const arr = byDay.get(d) ?? [];
          arr.push(r);
          byDay.set(d, arr);
        }
        for (const [day, sessions] of byDay) {
          const s = pickMainSleep(sessions);
          if (!s) continue;
          merge(map, day, {
            hrv_rmssd:        num(s.average_hrv),
            bedtime_start:    s.bedtime_start || null,
            bedtime_end:      s.bedtime_end || null,
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
            resting_hr:       num(s.lowest_heart_rate),
            respiration_avg:  num(s.average_breath),
            // RESTLESS PERIODS ARE NOT AWAKENINGS.
            restless_moments: num(s.restless_periods),
          });
        }
        read.push(f.name);
        break;
      }

      case 'dailysleep':
        for (const r of rows) merge(map, ymd(r.day), { sleep_score: num(r.score) });
        read.push(f.name);
        break;

      case 'dailyreadiness':
        for (const r of rows) merge(map, ymd(r.day), {
          readiness_score: num(r.score),
          // Deviation from the member's OWN baseline. Never a population.
          skin_temp_delta: num(r.temperature_deviation),
        });
        read.push(f.name);
        break;

      case 'dailyactivity':
        for (const r of rows) merge(map, ymd(r.day), { activity_score: num(r.score) });
        read.push(f.name);
        break;

      case 'dailystress':
        // stress_high is SECONDS SPENT IN HIGH STRESS, not a score. Oura ships
        // 3600 for one hour. Stored as MINUTES so the column carries a unit a
        // human can read, and so it never gets mistaken for a 0-100 score.
        for (const r of rows) merge(map, ymd(r.day), {
          stress_level: secToMin(r.stress_high),
        });
        read.push(f.name);
        break;

      case 'dailyspo2':
        for (const r of rows) merge(map, ymd(r.day), {
          spo2_avg: jsonNum(r.spo2_percentage, 'average'),
          breathing_index: num(r.breathing_disturbance_index),
        });
        read.push(f.name);
        break;

      default:
        // temperature.csv is 127k raw samples, heartrate.csv likewise — those
        // are a different resolution of question and are not day rows. Skipped
        // on purpose, and SAID OUT LOUD rather than silently dropped.
        ignored.push(f.name);
    }
  }

  const nights = [...map.values()].sort((a, b) => a.reading_date.localeCompare(b.reading_date));
  return {
    nights,
    filesRead: read,
    filesIgnored: ignored,
    firstDate: nights.length ? nights[0].reading_date : null,
    lastDate: nights.length ? nights[nights.length - 1].reading_date : null,
  };
}

/** How many night fields actually arrived — for honest import reporting. */
export function countNightFields(nights: OuraExportNight[]): number {
  const keys: (keyof OuraExportNight)[] = [
    'deep_min', 'rem_min', 'light_min', 'awake_min', 'efficiency_pct',
    'latency_min', 'resting_hr', 'spo2_avg', 'skin_temp_delta',
    'respiration_avg', 'restless_moments', 'bedtime_start',
  ];
  let n = 0;
  for (const r of nights) for (const k of keys) if (r[k] != null) n++;
  return n;
}
