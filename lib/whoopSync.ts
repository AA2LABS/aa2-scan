/**
 * ─── lib/whoopSync.ts ───────────────────────────────────────────────────────
 * WHOOP — THE LEDGER LANE. The flagship stops living in a zip file.
 *
 * FOUNDER ORDER 2026-08-21: "MAKE A FUCKING PIPE!" · "dont stop until finished"
 *
 * Until tonight WHOOP was ARCHIVE ONLY — the member had to request an export,
 * wait for an email, download a zip and hand AA2 the CSVs. Now it is a live
 * lane on the member's own OAuth grant.
 *
 * EVERY PATH AND FIELD NAME BELOW IS FROM WHOOP'S OWN API DOCS. Nothing
 * inferred. https://developer.whoop.com/api/
 *   base            https://api.prod.whoop.com/developer/
 *   sleep           /v2/activity/sleep
 *   recovery        /v2/recovery
 *   cycle           /v2/cycle
 *   query params    limit (<=25, default 10) · start (inclusive) ·
 *                   end (exclusive) · nextToken
 *
 * WHY THREE COLLECTIONS AND NOT ONE: WHOOP splits one night across three
 * objects. Sleep carries the architecture, Recovery carries the body
 * (resting HR, HRV, SpO2, SKIN TEMP), Cycle carries the day (strain, average
 * heart rate). The member's own export proved WHOOP is the only instrument in
 * this stack that ships skin temperature AND blood oxygen beside the sleep
 * stages — but only if all three are read and joined.
 *
 * THE JOIN IS BY CYCLE, NOT BY CLOCK. Sleep and Recovery both carry cycle_id;
 * the Cycle carries the start instant. The archive lane keyed its nights on
 * "Cycle start time", so this lane keys on exactly the same thing and the two
 * lanes cannot disagree about which day a night belongs to.
 *
 * NAPS ARE NOT NIGHTS. Sleep records carry `nap` and it is honoured, the same
 * way lib/whoopImport.ts honours the Nap column.
 * ────────────────────────────────────────────────────────────────────────────
 */

import type { BiosignalRow } from './biosignals';
import { getValidToken } from './oauth';

const BASE = 'https://api.prod.whoop.com/developer';
const PAGE = 25;                 // WHOOP's documented maximum
const MAX_PAGES = 40;            // a hard stop, so a bad nextToken cannot spin

type Paged<T> = { records?: T[]; next_token?: string };

async function getPaged<T>(
  path: string, token: string, start: string, end: string
): Promise<T[]> {
  const out: T[] = [];
  let next: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const q = new URLSearchParams({ limit: String(PAGE), start, end });
    if (next) q.set('nextToken', next);
    const r = await fetch(`${BASE}${path}?${q.toString()}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    if (!r.ok) {
      const t = await r.text();
      throw new Error(`WHOOP ${path} ${r.status}: ${t.slice(0, 160)}`);
    }
    const body = (await r.json()) as Paged<T>;
    out.push(...(body.records ?? []));
    next = body.next_token;
    if (!next) break;
  }
  return out;
}

/* ── the three shapes, exactly as WHOOP documents them ────────────────────── */

type WhoopCycle = {
  id?: number;
  start?: string;
  end?: string;
  score_state?: string;
  score?: { strain?: number; kilojoule?: number; average_heart_rate?: number; max_heart_rate?: number };
};

type WhoopSleep = {
  id?: string;
  cycle_id?: number;
  start?: string;
  end?: string;
  nap?: boolean;
  score_state?: string;
  score?: {
    stage_summary?: {
      total_in_bed_time_milli?: number;
      total_awake_time_milli?: number;
      total_no_data_time_milli?: number;
      total_light_sleep_time_milli?: number;
      total_slow_wave_sleep_time_milli?: number;
      total_rem_sleep_time_milli?: number;
      sleep_cycle_count?: number;
      disturbance_count?: number;
    };
    respiratory_rate?: number;
    sleep_performance_percentage?: number;
    sleep_consistency_percentage?: number;
    sleep_efficiency_percentage?: number;
  };
};

type WhoopRecovery = {
  cycle_id?: number;
  sleep_id?: string;
  score_state?: string;
  score?: {
    user_calibrating?: boolean;
    recovery_score?: number;
    resting_heart_rate?: number;
    hrv_rmssd_milli?: number;
    spo2_percentage?: number;
    skin_temp_celsius?: number;
  };
};

/* ── helpers ──────────────────────────────────────────────────────────────── */

const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;

/** WHOOP ships milliseconds. The membrane stores minutes. */
const msToMin = (v: unknown): number | null => {
  const n = num(v);
  return n == null ? null : Math.round(n / 60000);
};

const ymd = (v: unknown): string | null => {
  const m = String(v ?? '').match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
};

export type WhoopSyncScope = {
  days: number;
  firstDate: string | null;
  lastDate: string | null;
  napsSkipped: number;
  unscored: number;
};

export type WhoopPull = { rows: BiosignalRow[]; scope: WhoopSyncScope };

/**
 * Pull a date range and return membrane rows. Throws with WHOOP's own words if
 * the API refuses — never a silent empty result.
 */
export async function fetchWhoopRange(startYmd: string, endYmd: string): Promise<WhoopPull> {
  const token = await getValidToken('whoop');
  if (!token) throw new Error('WHOOP is not connected. Tap CONNECT in Bio Buddy.');

  // WHOOP wants ISO date-times; `end` is exclusive, so the caller's last day is
  // included by asking for the following midnight.
  const start = `${startYmd}T00:00:00.000Z`;
  const endEx = new Date(`${endYmd}T00:00:00.000Z`);
  endEx.setUTCDate(endEx.getUTCDate() + 1);
  const end = endEx.toISOString();

  const [cycles, sleeps, recoveries] = await Promise.all([
    getPaged<WhoopCycle>('/v2/cycle', token, start, end),
    getPaged<WhoopSleep>('/v2/activity/sleep', token, start, end),
    getPaged<WhoopRecovery>('/v2/recovery', token, start, end),
  ]);

  // cycle_id -> the day that cycle began. This is the key the archive lane uses.
  const cycleDay = new Map<number, string>();
  const cycleScore = new Map<number, NonNullable<WhoopCycle['score']>>();
  for (const c of cycles) {
    if (typeof c.id !== 'number') continue;
    const d = ymd(c.start);
    if (d) cycleDay.set(c.id, d);
    if (c.score) cycleScore.set(c.id, c.score);
  }

  const byDay = new Map<string, BiosignalRow>();
  const blank = (date: string): BiosignalRow => ({ source: 'whoop', originSource: 'whoop', readingDate: date });
  const put = (date: string, patch: Partial<BiosignalRow>) => {
    const cur = byDay.get(date) ?? blank(date);
    for (const [k, v] of Object.entries(patch)) {
      if (v !== null && v !== undefined) (cur as any)[k] = v;
    }
    byDay.set(date, cur);
  };

  let naps = 0, unscored = 0;

  for (const s of sleeps) {
    if (s.nap === true) { naps++; continue; }          // NAPS ARE NOT NIGHTS
    const date = (typeof s.cycle_id === 'number' ? cycleDay.get(s.cycle_id) : null) ?? ymd(s.start);
    if (!date) continue;
    const st = s.score?.stage_summary;
    if (!st) { unscored++; }

    const inBed  = msToMin(st?.total_in_bed_time_milli);
    const awake  = msToMin(st?.total_awake_time_milli);
    const noData = msToMin(st?.total_no_data_time_milli);
    // WHOOP does not ship "asleep" directly on this object. In bed, minus
    // awake, minus the stretches the strap could not read, is the night.
    const asleep = inBed == null ? null : inBed - (awake ?? 0) - (noData ?? 0);

    put(date, {
      bedtimeStart: s.start ?? null,
      bedtimeEnd: s.end ?? null,
      timeInBedMin: inBed,
      totalSleepMin: asleep,
      awakeMin: awake,
      lightMin: msToMin(st?.total_light_sleep_time_milli),
      deepMin:  msToMin(st?.total_slow_wave_sleep_time_milli),
      remMin:   msToMin(st?.total_rem_sleep_time_milli),
      efficiencyPct: num(s.score?.sleep_efficiency_percentage),
      respirationAvg: num(s.score?.respiratory_rate),
      // A DISTURBANCE IS NOT A RESTLESS MOMENT. Garmin's restless periods and
      // Muse's are the same question; WHOOP's disturbance count is a different
      // one. It lands in wakeEvents so the membrane never reports two answers
      // to two different questions as one disagreement.
      wakeEvents: num(st?.disturbance_count),
      sleep: num(s.score?.sleep_performance_percentage),
    });
  }

  for (const rec of recoveries) {
    const date = typeof rec.cycle_id === 'number' ? cycleDay.get(rec.cycle_id) : null;
    if (!date) continue;
    put(date, {
      // A VENDOR SCORE IS A POPULATION'S OPINION OF YOU. Recovery is stored so
      // it is visible and never as ground truth — on 2026-08-12 it fell nine
      // points while deep sleep rose 27% and REM rose 24%.
      readiness: num(rec.score?.recovery_score),
      restingHr: num(rec.score?.resting_heart_rate),
      hrv:       num(rec.score?.hrv_rmssd_milli),
      spo2Avg:   num(rec.score?.spo2_percentage),
      // skin_temp_celsius is an ABSOLUTE reading, not a deviation from the
      // member's own baseline. skinTempDelta means delta, so it stays empty
      // rather than being filled with a number that means something else.
      skinTempDelta: null,
    });
  }

  for (const c of cycles) {
    if (typeof c.id !== 'number') continue;
    const date = cycleDay.get(c.id);
    if (!date) continue;
    const sc = cycleScore.get(c.id);
    if (!sc) continue;
    put(date, { activity: num(sc.strain), avgHr: num(sc.average_heart_rate) });
  }

  const rows = [...byDay.values()].sort((a, b) => a.readingDate.localeCompare(b.readingDate));
  return {
    rows,
    scope: {
      days: rows.length,
      firstDate: rows.length ? rows[0].readingDate : null,
      lastDate: rows.length ? rows[rows.length - 1].readingDate : null,
      napsSkipped: naps,
      unscored,
    },
  };
}
