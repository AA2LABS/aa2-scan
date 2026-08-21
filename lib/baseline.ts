/**
 * ─── lib/baseline.ts ────────────────────────────────────────────────────────
 * THE BASELINE ENGINE — YOU ARE THE CONTROL GROUP.
 *
 * FOUNDER ORDER 2026-08-21: "you have 90 days of oura ... and you didnt cross
 * reference last nights number with historical data that would have told you a
 * lot right there."
 *
 * He was right, and the proof arrived the same hour. Ranked against his own
 * record, one night that every app called mediocre turned out to sit in the top
 * tenth of his year for slow-wave sleep — and a step change nobody's app had
 * mentioned showed up eight days earlier. He named the cause himself: he had
 * stopped drinking. WHOOP's own numbers then confirmed it — deep +27%, REM
 * +24%, awake −31% — while WHOOP's RECOVERY SCORE FELL NINE POINTS.
 *
 * THE VENDOR SCORE DISAGREED WITH THE VENDOR'S OWN INPUTS.
 *
 * That is the whole reason this file exists.
 *
 * ── THE LAWS THIS FILE ENFORCES ─────────────────────────────────────────────
 *
 * NOBODY'S 61 IS ANYBODY ELSE'S 74. Every number is ranked against the MEMBER'S
 * OWN history. There is no population in this file. There is no normal range.
 *
 * SEASON IS A CONFOUND, NOT A DETAIL. Ranking an August night against a January
 * baseline produced three false readings in one sitting — a "low" blood oxygen
 * that was actually above the summer median, a "fragmented" night that was
 * ordinary for summer, and a "good" resting heart rate that was dead average.
 * Every rank here is offered BOTH ways, and the seasonal one is the honest one.
 *
 * ONE HEARTBEAT, ONE VOTE. Sources are ranked SEPARATELY and never averaged.
 * When they disagree, the disagreement is the finding.
 *
 * NO NAKED NUMBERS. A percentile is meaningless alone. Every rank carries how
 * many nights it was measured against and what the member's own median is.
 *
 * CONFIDENCE IS STATED, NEVER ASSUMED. Clarifier tiers govern: under 3 nights
 * the engine says so and stops.
 * ────────────────────────────────────────────────────────────────────────────
 */

import { supabase } from './supabase';
import type { BiosignalSource } from './biosignals';

// ── CONFIDENCE — Clarifier tiers, canon ─────────────────────────────────────
export type Tier = 'SEEDED' | 'EMERGING' | 'ESTABLISHED' | 'LOCKED';

export function tierFor(n: number): Tier {
  if (n >= 15) return 'LOCKED';
  if (n >= 8) return 'ESTABLISHED';
  if (n >= 3) return 'EMERGING';
  return 'SEEDED';
}

/** Metrics the engine ranks. Direction says which way is better FOR THE MEMBER. */
export type MetricKey =
  | 'total_sleep_min' | 'deep_min' | 'rem_min' | 'light_min' | 'awake_min'
  | 'efficiency_pct' | 'latency_min' | 'resting_hr' | 'hrv_rmssd'
  | 'spo2_avg' | 'respiration_avg' | 'restless_moments' | 'skin_temp_delta';

type Dir = 'higher' | 'lower' | 'neutral';

export const METRICS: { key: MetricKey; label: string; unit: string; dir: Dir }[] = [
  { key: 'total_sleep_min', label: 'Total sleep',   unit: 'min', dir: 'higher' },
  { key: 'deep_min',        label: 'Deep sleep',    unit: 'min', dir: 'higher' },
  { key: 'rem_min',         label: 'REM',           unit: 'min', dir: 'higher' },
  // LIGHT SLEEP IS NOT A GOAL. It is what is left over. Ranked, never judged.
  { key: 'light_min',       label: 'Light sleep',   unit: 'min', dir: 'neutral' },
  { key: 'awake_min',       label: 'Awake',         unit: 'min', dir: 'lower'  },
  { key: 'efficiency_pct',  label: 'Efficiency',    unit: '%',   dir: 'higher' },
  { key: 'latency_min',     label: 'Time to sleep', unit: 'min', dir: 'lower'  },
  { key: 'resting_hr',      label: 'Resting HR',    unit: 'bpm', dir: 'lower'  },
  { key: 'hrv_rmssd',       label: 'HRV',           unit: 'ms',  dir: 'higher' },
  { key: 'spo2_avg',        label: 'Blood oxygen',  unit: '%',   dir: 'higher' },
  { key: 'respiration_avg', label: 'Respiration',   unit: 'brpm', dir: 'neutral' },
  { key: 'restless_moments',label: 'Restless',      unit: '',    dir: 'lower'  },
  { key: 'skin_temp_delta', label: 'Skin temp',     unit: '°',   dir: 'neutral' },
];

export type NightRow = { reading_date: string; source: BiosignalSource } & Partial<Record<MetricKey, number | null>>;

export type MetricRank = {
  key: MetricKey;
  label: string;
  unit: string;
  dir: Dir;
  value: number;
  /** Rank against every night on record for this source. */
  allPct: number | null;
  allMedian: number | null;
  allN: number;
  /** Rank against nights in the SAME PART OF THE YEAR. The honest one. */
  seasonPct: number | null;
  seasonMedian: number | null;
  seasonN: number;
  seasonTier: Tier;
  /** True when the two ranks disagree by more than 25 points — season is doing the work. */
  seasonalArtifact: boolean;
};

export type NightRank = {
  date: string;
  source: BiosignalSource;
  metrics: MetricRank[];
  /** Metrics that landed in the top or bottom tenth of the member's own record. */
  standouts: MetricRank[];
};

// ── MATH ─────────────────────────────────────────────────────────────────────
function nums(rows: NightRow[], key: MetricKey): number[] {
  return rows.map(r => r[key]).filter((x): x is number => typeof x === 'number' && Number.isFinite(x));
}

function median(v: number[]): number | null {
  if (!v.length) return null;
  const s = [...v].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Percent of the member's own nights that fall BELOW this value. */
export function percentileOf(value: number, series: number[]): number | null {
  if (!series.length) return null;
  return Math.round((100 * series.filter(x => x < value).length) / series.length);
}

/** Day of year, 1–366. */
function doy(d: string): number {
  const dt = new Date(d + 'T00:00:00Z');
  const start = Date.UTC(dt.getUTCFullYear(), 0, 1);
  return Math.floor((dt.getTime() - start) / 86400000) + 1;
}

/** Circular distance in days between two dates, ignoring year. */
function seasonalDistance(a: string, b: string): number {
  const d = Math.abs(doy(a) - doy(b));
  return Math.min(d, 366 - d);
}

/**
 * NIGHTS FROM THE SAME PART OF THE YEAR, any year, excluding the night itself.
 * Widens automatically until there is enough to speak, because a truthful wide
 * window beats a confident narrow one.
 */
export function seasonalPeers(
  date: string, rows: NightRow[], startWindow = 45, minN = 12
): { peers: NightRow[]; windowDays: number } {
  let w = startWindow;
  while (w <= 183) {
    const peers = rows.filter(r => r.reading_date !== date && seasonalDistance(r.reading_date, date) <= w);
    if (peers.length >= minN || w === 183) return { peers, windowDays: w };
    w += 30;
  }
  return { peers: [], windowDays: 183 };
}

// ── THE RANK ─────────────────────────────────────────────────────────────────
export function rankNight(date: string, rows: NightRow[], source: BiosignalSource): NightRank | null {
  const mine = rows.filter(r => r.source === source);
  const night = mine.find(r => r.reading_date === date);
  if (!night) return null;

  const history = mine.filter(r => r.reading_date !== date);
  const { peers } = seasonalPeers(date, history);

  const metrics: MetricRank[] = [];
  for (const m of METRICS) {
    const v = night[m.key];
    if (typeof v !== 'number' || !Number.isFinite(v)) continue;

    const allSeries = nums(history, m.key);
    const seaSeries = nums(peers, m.key);
    const allPct = percentileOf(v, allSeries);
    const seasonPct = percentileOf(v, seaSeries);

    metrics.push({
      key: m.key, label: m.label, unit: m.unit, dir: m.dir, value: v,
      allPct, allMedian: median(allSeries), allN: allSeries.length,
      seasonPct, seasonMedian: median(seaSeries), seasonN: seaSeries.length,
      seasonTier: tierFor(seaSeries.length),
      // A gap this wide means the calendar was doing the talking, not the body.
      seasonalArtifact: allPct != null && seasonPct != null && Math.abs(allPct - seasonPct) >= 25,
    });
  }

  const standouts = metrics.filter(m => {
    const p = m.seasonPct ?? m.allPct;
    return p != null && (p >= 85 || p <= 15) && m.seasonTier !== 'SEEDED';
  }).sort((a, b) => {
    const pa = Math.abs((a.seasonPct ?? a.allPct ?? 50) - 50);
    const pb = Math.abs((b.seasonPct ?? b.allPct ?? 50) - 50);
    return pb - pa;
  });

  return { date, source, metrics, standouts };
}

// ── STEP CHANGE — the thing no app looks for ────────────────────────────────
export type StepChange = {
  key: MetricKey;
  label: string;
  unit: string;
  /** First date of the AFTER segment. */
  date: string;
  beforeMean: number;
  afterMean: number;
  delta: number;
  /** Percent change. NULL when the baseline sits near zero — see below. */
  pctChange: number | null;
  /** Change measured in the series' own standard deviations. Always safe. */
  effectSize: number;
  beforeN: number;
  afterN: number;
};

/**
 * Finds the single split point that most separates a series into two levels.
 * This is deliberately simple and deliberately honest: it reports the best
 * split it can find and the sizes of both sides, so a thin segment is visible
 * rather than hidden inside a confident number.
 *
 * IT NAMES NO CAUSE. On 2026-08-12 this would have found the founder's step
 * change eight days before he mentioned it — and it would still have been HIM
 * who said the word "alcohol." The engine finds the WHEN. The member owns the WHY.
 */
export function findStepChange(
  rows: NightRow[], key: MetricKey, minSegment = 5, minPctChange = 10
): StepChange | null {
  const pts = rows
    .filter(r => typeof r[key] === 'number' && Number.isFinite(r[key] as number))
    .sort((a, b) => a.reading_date.localeCompare(b.reading_date))
    .map(r => ({ d: r.reading_date, v: r[key] as number }));

  if (pts.length < minSegment * 2) return null;

  const mean = (a: { v: number }[]) => a.reduce((s, x) => s + x.v, 0) / a.length;
  const sd = (a: { v: number }[]) => {
    const m = mean(a);
    return Math.sqrt(a.reduce((s, x) => s + (x.v - m) ** 2, 0) / Math.max(1, a.length - 1));
  };
  // CAUGHT IN TESTING 2026-08-21 ON REAL DATA: skin temperature is a DEVIATION
  // that hovers around zero, so percent change reported "fell about 3325%".
  // A percentage of nearly nothing is nonsense. Any metric whose baseline is
  // small relative to its own spread reports EFFECT SIZE instead, and pctChange
  // comes back null rather than a number that would embarrass the membrane.
  const wholeSd = sd(pts);
  let best: StepChange | null = null;
  let bestScore = 0;

  for (let i = minSegment; i <= pts.length - minSegment; i++) {
    const A = pts.slice(0, i), B = pts.slice(i);
    const ma = mean(A), mb = mean(B);
    const delta = mb - ma;
    // Weight by the smaller segment so a two-night tail cannot win.
    const score = Math.abs(delta) * Math.min(A.length, B.length);
    if (score > bestScore) {
      bestScore = score;
      const meta = METRICS.find(m => m.key === key)!;
      // Percent is only honest when the baseline is meaningfully non-zero.
      const pctSafe = Math.abs(ma) > Math.max(1e-6, wholeSd * 0.5);
      best = {
        key, label: meta.label, unit: meta.unit, date: B[0].d,
        beforeMean: ma, afterMean: mb, delta,
        pctChange: pctSafe ? (delta / ma) * 100 : null,
        effectSize: wholeSd > 0 ? delta / wholeSd : 0,
        beforeN: A.length, afterN: B.length,
      };
    }
  }
  if (!best) return null;
  // A step must clear EITHER a real percent move OR half a standard deviation.
  const bigPct = best.pctChange != null && Math.abs(best.pctChange) >= minPctChange;
  const bigEff = Math.abs(best.effectSize) >= 0.5;
  return (bigPct || bigEff) ? best : null;
}

/** Every metric that shows a step change, biggest first. */
export function findAllStepChanges(rows: NightRow[], minPctChange = 10): StepChange[] {
  return METRICS
    .map(m => findStepChange(rows, m.key, 5, minPctChange))
    .filter((x): x is StepChange => x != null)
    .sort((a, b) => Math.abs(b.effectSize) - Math.abs(a.effectSize));
}

// ── PLAIN LANGUAGE — NO NAKED NUMBERS ───────────────────────────────────────
const NIGHT_COLUMNS_RANK =
  'source, reading_date, total_sleep_min, deep_min, rem_min, light_min, awake_min, ' +
  'efficiency_pct, latency_min, resting_hr, hrv_rmssd, spo2_avg, respiration_avg, ' +
  'restless_moments, skin_temp_delta';

export async function loadNights(days = 730): Promise<NightRow[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const since = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('biosignal_readings')
      .select(NIGHT_COLUMNS_RANK)
      .eq('member_id', user.id)
      .gte('reading_date', since)
      .order('reading_date', { ascending: true });
    if (error) { console.log('[baseline] read error:', error.message); return []; }
    return ((data ?? []) as any[]) as NightRow[];
  } catch { return []; }
}

/**
 * One metric, said the way a person says it. Never a bare percentile.
 * Reports the SEASONAL rank when it exists, because that is the honest one, and
 * says out loud when the all-time rank would have misled.
 */
export function describeRank(m: MetricRank): string {
  const p = m.seasonPct ?? m.allPct;
  const n = m.seasonPct != null ? m.seasonN : m.allN;
  const med = m.seasonPct != null ? m.seasonMedian : m.allMedian;
  if (p == null || n < 3) {
    return `${m.label} ${m.value}${m.unit} — not enough of your own nights yet to say whether that is unusual for you.`;
  }
  const where =
    p >= 95 ? 'the highest stretch of your own record' :
    p >= 85 ? 'the top tenth of your own nights' :
    p >= 65 ? 'the upper end for you' :
    p >= 35 ? 'ordinary for you' :
    p >= 15 ? 'the lower end for you' :
    p >= 5  ? 'the bottom tenth of your own nights' :
              'the lowest stretch of your own record';

  const cmp = med == null ? '' :
    m.value > med ? ` Your own median is ${Math.round(med * 10) / 10}${m.unit}.` :
    m.value < med ? ` Your own median is ${Math.round(med * 10) / 10}${m.unit}.` : '';

  const season = m.seasonPct != null
    ? ` Measured against ${n} of your own nights from this time of year.`
    : ` Measured against ${n} of your own nights.`;

  const artifact = m.seasonalArtifact
    ? ` Against your whole record it would read very differently — that gap is the calendar, not you.`
    : '';

  return `${m.label} ${m.value}${m.unit} — ${where}.${cmp}${season}${artifact}`;
}

export function describeStepChange(s: StepChange): string {
  const dir = s.delta > 0 ? 'rose' : 'fell';
  const size = s.pctChange != null
    ? `about ${Math.abs(Math.round(s.pctChange))}%`
    : `by ${Math.round(Math.abs(s.delta) * 100) / 100}${s.unit}`;
  return `${s.label} ${dir} ${size} around ${s.date} — ` +
    `${Math.round(s.beforeMean * 10) / 10}${s.unit} across the ${s.beforeN} nights before, ` +
    `${Math.round(s.afterMean * 10) / 10}${s.unit} across the ${s.afterN} nights since. ` +
    `Something changed. AA2 does not know what. You do.`;
}
