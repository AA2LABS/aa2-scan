// ─── lib/clarifier-measure.ts ────────────────────────────────────────────────
// THE MEASUREMENT HALF OF THE WEIGHTING ENGINE.
//
// lib/clarifier-weights.ts has carried the seeds, the tiers and the blend
// since it was written. What it never had was anything to blend WITH:
// resolveWeight() takes a `measuredMagnitude` and nothing in the app ever
// computed one, so every weight in AA2 has been a seed wearing a tier.
//
// Canon Part VIII, THE BUILD, names the missing work exactly: "store the
// biosignal delta alongside each clarifier_corrected event in membrane_events,
// and compute personal weights once instance counts clear the gate." This is
// that file.
//
// ── WHERE AA2 WINS, AND WHY THIS IS NOT WHOOP'S ENGINE ──────────────────────
// WHOOP asks "did you drink today?" and splits whole DAYS into two buckets.
// Day-level means it cannot separate confounds: drink on the nights you also
// eat late and both get blamed equally.
//
// The Clarifier is EVENT-ANCHORED. The member explains a specific moment in
// their own words, so the category attaches to the event and not to the
// calendar. The arithmetic below is still a within-subject comparison — the
// honest, boring, defensible kind — but the label on each day came from the
// member naming a thing that happened, which is why AA2 does not inherit the
// confound.
//
// ── THE LAWS THIS FILE OBEYS ────────────────────────────────────────────────
// NO NAKED NUMBERS — every return carries its own n, its metric and its unit.
// MEASURED, NOT JUDGED — deltas are against the member's own baseline window,
//   never a population.
// THE INSTANCE GATE — nothing is reported until both buckets have enough days
//   to mean anything. Below the gate the seed stands and says so.
// VENDOR-OUTPUT BAN — HRV in milliseconds and resting heart rate only. No
//   recovery score, no readiness, no Body Battery. Those are opinions.

import { supabase } from './supabase';
import type { ClarifierCategory } from './clarifier';
import { resolveWeight, type LearnedWeight } from './clarifier-weights';

/** Both buckets must hold at least this many days before a delta is spoken.
 *  Canon's reverse-engineering of the comparable engine put the honest floor
 *  at "roughly ten or more" instances; AA2 states its own floor out loud. */
export const INSTANCE_GATE = 4;

/** The only two channels permitted. Both are raw measurement. */
export type MeasuredMetric = 'hrv' | 'restingHr';

export type CategoryMeasurement = {
  category: ClarifierCategory;
  /** Days the member clarified this category. */
  nPresent: number;
  /** Days in the window with no clarification of this category. */
  nAbsent: number;
  metric: MeasuredMetric;
  unit: string;
  /** mean(present) − mean(absent), in the metric's own unit. */
  delta: number | null;
  /** 1–10, derived from the delta against the member's own spread. */
  magnitude: number | null;
  /** True when both buckets cleared INSTANCE_GATE. */
  gateCleared: boolean;
  /** Why this is or is not being reported — WHY-FIRST. */
  why: string;
};

type DayRow = { ymd: string; hrv: number | null; restingHr: number | null };

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = (xs: number[]) => {
  if (xs.length < 2) return 0;
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / (xs.length - 1));
};

/**
 * MAGNITUDE IS THE DELTA IN THE MEMBER'S OWN SPREAD, NOT A FIXED SCALE.
 *
 * A fourteen-millisecond HRV move is enormous for a steady body and ordinary
 * for a volatile one. Scaling by the member's own standard deviation is what
 * makes a 1–10 number mean the same thing for two different people — and it
 * is the Vendor-Output Ban applied to the weights themselves, because a fixed
 * universal scale is a population average wearing a personalization costume.
 *
 * One standard deviation of movement reads as 5/10. Two or more saturates.
 */
function magnitudeFromDelta(delta: number, spread: number): number | null {
  if (!Number.isFinite(delta) || !(spread > 0)) return null;
  const z = Math.abs(delta) / spread;
  return Math.max(1, Math.min(10, Math.round(z * 5 * 10) / 10));
}

/** Pull the member's day rows for the window. Raw channels only. */
async function loadDays(memberId: string, days: number): Promise<DayRow[]> {
  const since = new Date(Date.now() - days * 86400_000).toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('biosignal_readings')
    .select('reading_date, hrv_rmssd, resting_hr')
    .eq('member_id', memberId)
    .gte('reading_date', since)
    .order('reading_date', { ascending: true });
  if (error || !data) return [];

  // ONE HEARTBEAT, ONE VOTE. Several instruments can report the same night;
  // the day is collapsed to one value per channel by mean, so a member wearing
  // four sensors does not get four votes on the same body.
  const byDay = new Map<string, { hrv: number[]; rhr: number[] }>();
  for (const r of data as any[]) {
    const k = r.reading_date as string;
    const slot = byDay.get(k) ?? { hrv: [], rhr: [] };
    if (r.hrv_rmssd != null) slot.hrv.push(Number(r.hrv_rmssd));
    if (r.resting_hr != null) slot.rhr.push(Number(r.resting_hr));
    byDay.set(k, slot);
  }
  return [...byDay.entries()].map(([ymd, v]) => ({
    ymd,
    hrv: v.hrv.length ? mean(v.hrv) : null,
    restingHr: v.rhr.length ? mean(v.rhr) : null,
  }));
}

/** Which days carry which clarified categories, from membrane_events. */
async function loadClarifiedDays(
  memberId: string, days: number,
): Promise<Map<ClarifierCategory, Set<string>>> {
  const since = new Date(Date.now() - days * 86400_000).toISOString();
  const out = new Map<ClarifierCategory, Set<string>>();
  const { data, error } = await supabase
    .from('membrane_events')
    .select('event_type, subject, value, created_at')
    .eq('member_id', memberId)
    .in('event_type', ['clarifier_corrected', 'clarifier_entry'])
    .gte('created_at', since);
  if (error || !data) return out;

  for (const e of data as any[]) {
    const cat = (e.value?.category ?? e.subject) as ClarifierCategory | undefined;
    if (!cat) continue;
    const ymd = String(e.created_at).slice(0, 10);
    const set = out.get(cat) ?? new Set<string>();
    set.add(ymd);
    out.set(cat, set);
  }
  return out;
}

/**
 * THE ENGINE. For one category, compare the member's own metric on the days
 * they clarified it against the days they did not.
 *
 * INTIMACY IS EXCLUDED FROM EVERY RANKING THAT COULD BE SHARED — but it is
 * NOT excluded from measurement. It carries a weight and it informs recovery;
 * it simply never appears in a family view. The caller enforces that, because
 * dropping it here would silently corrupt every other category's "absent"
 * bucket by leaving its days in.
 */
export function measureCategory(
  category: ClarifierCategory,
  days: DayRow[],
  clarified: Set<string>,
  metric: MeasuredMetric = 'hrv',
): CategoryMeasurement {
  const unit = metric === 'hrv' ? 'ms' : ' bpm';
  const valued = days.filter(d => d[metric] != null) as (DayRow & Record<MeasuredMetric, number>)[];

  const present = valued.filter(d => clarified.has(d.ymd)).map(d => Number(d[metric]));
  const absent  = valued.filter(d => !clarified.has(d.ymd)).map(d => Number(d[metric]));

  const base = {
    category, metric, unit,
    nPresent: present.length,
    nAbsent: absent.length,
  };

  if (present.length < INSTANCE_GATE || absent.length < INSTANCE_GATE) {
    return {
      ...base, delta: null, magnitude: null, gateCleared: false,
      why: `Not enough of your own days yet — ${present.length} with it, ${absent.length} without, and the gate is ${INSTANCE_GATE} on each side. The seed still stands and it is still a guess.`,
    };
  }

  const delta = Math.round((mean(present) - mean(absent)) * 10) / 10;
  const spread = sd(valued.map(d => Number(d[metric])));
  const magnitude = magnitudeFromDelta(delta, spread);
  const dirWord = metric === 'hrv'
    ? (delta < 0 ? 'costs you' : 'returns')
    : (delta > 0 ? 'costs you' : 'returns');

  return {
    ...base, delta, magnitude, gateCleared: true,
    why: `On your own ${present.length} days with it against ${absent.length} without, ${category} ${dirWord} ${Math.abs(delta)}${unit} of ${metric === 'hrv' ? 'heart-rate variability' : 'resting heart rate'}. Measured against your spread, not a population.`,
  };
}

/** Every category the member has clarified, measured, newest window. */
export async function measureAll(
  memberId: string, windowDays = 90, metric: MeasuredMetric = 'hrv',
): Promise<CategoryMeasurement[]> {
  const [days, clarified] = await Promise.all([
    loadDays(memberId, windowDays),
    loadClarifiedDays(memberId, windowDays),
  ]);
  if (!days.length) return [];
  const out: CategoryMeasurement[] = [];
  for (const [cat, set] of clarified) out.push(measureCategory(cat, days, set, metric));
  // RANK BY EFFECT SIZE so the member's largest personal lever surfaces first.
  return out.sort((a, b) => Math.abs(b.delta ?? 0) - Math.abs(a.delta ?? 0));
}

/** Measurements folded back into the weights engine, ready for weightLine(). */
export async function learnedWeights(
  memberId: string, windowDays = 90,
): Promise<{ category: ClarifierCategory; weight: LearnedWeight; measurement: CategoryMeasurement }[]> {
  const measurements = await measureAll(memberId, windowDays);
  return measurements.map(m => ({
    category: m.category,
    measurement: m,
    weight: resolveWeight(m.category, {
      n: m.nPresent,
      measuredMagnitude: m.gateCleared ? (m.magnitude ?? undefined) : undefined,
      measured: m.gateCleared && m.delta != null
        ? { metric: m.metric === 'hrv' ? 'HRV' : 'resting HR', delta: m.delta, unit: m.unit }
        : undefined,
    }),
  }));
}
