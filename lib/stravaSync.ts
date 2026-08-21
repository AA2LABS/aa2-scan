/**
 * ─── lib/stravaSync.ts ──────────────────────────────────────────────────────
 * STRAVA — THE LEDGER LANE, standing next to a CSV lane that already works.
 *
 * FOUNDER ORDER 2026-08-21: "dont stop until finished."
 *
 * Strava was listed in the device catalog as "Strava API + activities.csv
 * export (wired in-app)". The audit found only half of that was true: the CSV
 * import existed, the API did not. This is the missing half.
 *
 * EVERY PATH AND FIELD BELOW IS FROM STRAVA'S OWN DOCS. Nothing inferred.
 *   https://developers.strava.com/docs/authentication/
 *   athlete activities   GET https://www.strava.com/api/v3/athlete/activities
 *   params               after (epoch s) · before (epoch s) · page · per_page
 *   activity fields      start_date_local · distance (METRES) · moving_time ·
 *                        elapsed_time · type · sport_type
 *
 * WHY THIS LANE CAN CHECK ITSELF: the CSV lane already stores daily miles from
 * activities.csv. This lane computes the same number from the same athlete's
 * activities. If the two ever disagree, that disagreement is a real finding
 * about the pipe — which is exactly what AA2 exists to surface.
 *
 * UNITS: Strava ships METRES. The CSV lane read Strava's "Distance" column as
 * kilometres and multiplied by 0.621371 to reach miles. This lane converts
 * metres to miles directly (÷ 1609.344) so both lanes land on MILES and the
 * comparison is honest rather than an artefact of two different conversions.
 * ────────────────────────────────────────────────────────────────────────────
 */

import type { BiosignalRow } from './biosignals';
import { getValidToken } from './oauth';

const API = 'https://www.strava.com/api/v3';
const PER_PAGE = 100;      // Strava's practical page size
const MAX_PAGES = 20;      // a hard stop, so a bad response cannot spin

const METRES_PER_MILE = 1609.344;

type StravaActivity = {
  id?: number;
  start_date_local?: string;
  distance?: number;         // METRES
  moving_time?: number;      // seconds
  elapsed_time?: number;     // seconds
  type?: string;
  sport_type?: string;
};

export type StravaPull = {
  rows: BiosignalRow[];
  activities: number;
  firstDate: string | null;
  lastDate: string | null;
};

const ymd = (v: unknown): string | null => {
  const m = String(v ?? '').match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
};

/**
 * Pull the athlete's activities in a date range and fold them into daily miles.
 * Throws with Strava's own words if the API refuses — never a silent empty.
 */
export async function fetchStravaRange(startYmd: string, endYmd: string): Promise<StravaPull> {
  const token = await getValidToken('strava');
  if (!token) throw new Error('Strava is not connected. Tap CONNECT in Bio Buddy.');

  // Strava takes epoch SECONDS. `after` is exclusive of earlier activities and
  // `before` is exclusive of later ones, so the window is opened a day wide at
  // each end and trimmed by date afterwards rather than losing edge days.
  const after  = Math.floor(new Date(`${startYmd}T00:00:00Z`).getTime() / 1000) - 86400;
  const before = Math.floor(new Date(`${endYmd}T00:00:00Z`).getTime() / 1000) + 2 * 86400;

  const all: StravaActivity[] = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const q = new URLSearchParams({
      after: String(after), before: String(before),
      page: String(page), per_page: String(PER_PAGE),
    });
    const r = await fetch(`${API}/athlete/activities?${q.toString()}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
    });
    if (!r.ok) {
      const t = await r.text();
      throw new Error(`Strava activities ${r.status}: ${t.slice(0, 160)}`);
    }
    const batch = (await r.json()) as StravaActivity[];
    if (!Array.isArray(batch) || !batch.length) break;
    all.push(...batch);
    if (batch.length < PER_PAGE) break;
  }

  const perDay = new Map<string, number>();
  for (const a of all) {
    // start_date_local, not start_date. A ride that began at 9pm belongs to the
    // day the member lived, not to whatever UTC says.
    const d = ymd(a.start_date_local);
    if (!d || d < startYmd || d > endYmd) continue;
    const metres = typeof a.distance === 'number' && Number.isFinite(a.distance) ? a.distance : 0;
    if (metres <= 0) continue;
    perDay.set(d, (perDay.get(d) ?? 0) + metres / METRES_PER_MILE);
  }

  const rows: BiosignalRow[] = [...perDay.entries()]
    .sort((x, y) => x[0].localeCompare(y[0]))
    .map(([date, mi]) => ({
      source: 'strava' as const,
      originSource: 'strava' as const,
      readingDate: date,
      activity: Math.round(mi * 10) / 10,
    }));

  return {
    rows,
    activities: all.length,
    firstDate: rows.length ? rows[0].readingDate : null,
    lastDate: rows.length ? rows[rows.length - 1].readingDate : null,
  };
}
