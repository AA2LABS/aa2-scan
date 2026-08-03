// ─── lib/clarifier-weights.ts ────────────────────────────────────────────────
// THE WEIGHT LAW — founder ruling 2026-08-03.
//
// "The words need a number attached or there's nothing to compute against."
//
// Every Clarifier category carries THREE fields, not one:
//
//   MAGNITUDE (1–10)  — how hard the body moved.
//   VALENCE  (+1/0/−1) — which direction it moved the member.
//   CONFIDENCE (n)     — how many times YOUR body has proven it.
//
// WHY TWO AXES AND NOT ONE (locked reasoning, never re-litigated):
// clarifier.ts already states the founding problem — "the body reports arousal
// and stress with the same raw signals; only context separates them." A single
// combined scale rebuilds that exact bug: intimacy at 7 and conflict at 7 land
// on the same number and the membrane is guessing again. Magnitude and valence
// are different questions, so they are different fields. Forever.
//
// WHY CONFIDENCE (the field that makes it AA2 and not WHOOP):
// The seeds below are a POPULATION GUESS — a fixed universal scale is an
// average wearing a personalization costume, which the vendor-output ban
// forbids AA2 from stating as fact. So the seed is only a starting point.
// Every clarified instance is measured against the member's own biosignal
// delta, and the learned number overwrites the seed:
//   "Conflict costs you 14ms of HRV. The seed said 8. Your body says 14."
// One instance is a guess. Five is a pattern. Fifteen is a weight AA2 can
// state as fact. This is the 90-day no-judgment law applied per category.
//
// WHY-FIRST LAW: every weight renders with its reason attached. No naked
// numbers, ever.
// ─────────────────────────────────────────────────────────────────────────────

import type { ClarifierCategory } from './clarifier';

export type Valence = 1 | 0 | -1;

/** How much of the member's own truth stands behind a weight. */
export type WeightTier = 'SEED' | 'PATTERN' | 'YOUR LAW';

export interface CategoryWeight {
  /** 1–10 · how hard the body moved. Seed = population starting point. */
  magnitude: number;
  /** +1 restorative/positive · 0 neutral · −1 costly/negative. */
  valence: Valence;
  /** Plain-language reason the weight exists — WHY-FIRST law. */
  why: string;
}

/**
 * THE SEEDS — a starting guess, openly labeled as one.
 * These are NOT claims about the member. They are the line the member's own
 * body is measured against, and they are meant to be overwritten.
 */
export const SEED_WEIGHTS: Record<ClarifierCategory, CategoryWeight> = {
  intimacy:   { magnitude: 6, valence:  1, why: 'Real physiological load, restorative direction. Same raw signals as stress — opposite meaning. Private by law.' },
  excitement: { magnitude: 7, valence:  1, why: 'High arousal the body pays for, but in the direction you wanted to go. Costs energy, does not cost you.' },
  exercise:   { magnitude: 7, valence:  1, why: 'Chosen load. The body spends, then adapts — exertion is a deposit, not a withdrawal.' },
  heat:       { magnitude: 5, valence:  1, why: 'Heart rate rises without distress. Cardiovascular load with a recovery upside.' },
  stimulant:  { magnitude: 4, valence:  0, why: 'Neither good nor bad on its own — Chemical Doctrine says timing and cumulative load decide.' },
  conflict:   { magnitude: 8, valence: -1, why: 'Genuine distress. Stays stress. High arousal in the direction that costs you.' },
  illness:    { magnitude: 9, valence: -1, why: 'The immune system is spending everything. Highest cost the membrane tracks outside emergency.' },
  travel:     { magnitude: 6, valence: -1, why: 'Circadian disruption, altitude, dehydration — a real bill even when the trip is joy.' },
  stress:     { magnitude: 7, valence: -1, why: 'Confirmed by the member. The read was right and the body paid for it.' },
};

/** What the member's own history has proven, when it has proven anything. */
export interface LearnedWeight extends CategoryWeight {
  /** Instances of this category clarified by this member. */
  n: number;
  tier: WeightTier;
  /** Measured biosignal cost, when the membrane has enough to state one. */
  measured?: { metric: string; delta: number; unit: string };
}

/** n → tier. One is a guess. Five is a pattern. Fifteen is your law. */
export function tierFor(n: number): WeightTier {
  if (n >= 15) return 'YOUR LAW';
  if (n >= 5)  return 'PATTERN';
  return 'SEED';
}

/**
 * THE OVERWRITE — the seed steps aside as the member's body speaks.
 * Blend is weighted by instance count so the number moves toward truth
 * instead of snapping to a small sample: at n=0 it is pure seed, at n=15
 * it is effectively the member's own measured weight.
 */
export function resolveWeight(
  category: ClarifierCategory,
  history: { n: number; measuredMagnitude?: number; measured?: LearnedWeight['measured'] },
): LearnedWeight {
  const seed = SEED_WEIGHTS[category];
  const n = Math.max(0, history.n ?? 0);
  const tier = tierFor(n);

  let magnitude = seed.magnitude;
  if (history.measuredMagnitude != null && n > 0) {
    const w = Math.min(1, n / 15);                    // trust grows with evidence
    magnitude = seed.magnitude * (1 - w) + history.measuredMagnitude * w;
  }

  return {
    magnitude: Math.round(magnitude * 10) / 10,
    valence: seed.valence,                            // direction is definitional, not learned
    why: seed.why,
    n, tier,
    measured: history.measured,
  };
}

/**
 * THE WHY LINE — how a weight explains itself on screen (WHY-FIRST law).
 * Never renders a naked number.
 */
export function weightLine(category: ClarifierCategory, w: LearnedWeight): string {
  const dir = w.valence > 0 ? 'in your favor' : w.valence < 0 ? 'against you' : 'neutral';
  if (w.tier === 'SEED') {
    return `Starting estimate only — ${w.magnitude}/10, ${dir}. ${w.why} The membrane has seen this ${w.n === 1 ? 'once' : `${w.n} times`} from you; it is still a guess until your body proves it.`;
  }
  if (w.tier === 'PATTERN') {
    const m = w.measured ? ` Your ${w.measured.metric} moves ${Math.abs(w.measured.delta)}${w.measured.unit} on these days.` : '';
    return `Pattern forming — ${w.magnitude}/10, ${dir}, across ${w.n} of your own instances.${m} Not yet law, but no longer a guess.`;
  }
  const m = w.measured ? ` Measured: ${w.measured.metric} ${w.measured.delta > 0 ? '+' : ''}${w.measured.delta}${w.measured.unit}.` : '';
  return `Your law — ${w.magnitude}/10, ${dir}, proven across ${w.n} instances.${m} The seed has been replaced by you.`;
}

/**
 * DAY LOAD — what the clarified categories cost or gave a member today.
 * Positive valence returns credit, negative returns cost. This is the number
 * the pyramid strata are computed against.
 */
export function dayLoad(entries: { category: ClarifierCategory; weight: LearnedWeight }[]) {
  let cost = 0, credit = 0;
  for (const e of entries) {
    if (e.weight.valence < 0) cost += e.weight.magnitude;
    else if (e.weight.valence > 0) credit += e.weight.magnitude;
  }
  return { cost: Math.round(cost * 10) / 10, credit: Math.round(credit * 10) / 10, net: Math.round((credit - cost) * 10) / 10 };
}
