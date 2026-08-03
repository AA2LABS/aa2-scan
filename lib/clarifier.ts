// ─── lib/clarifier.ts ────────────────────────────────────────────────────────
// THE CLARIFIER'S BRAIN — the member supplies the meaning the device could not.
// Founder law (2026-08-01): the body reports arousal and stress with the same
// raw signals — elevated HR, HRV shift, skin response. Only context separates
// them, and the member owns the context. Sexual activity is NEVER logged as
// stress. It is its own category: private, shame-free, recovery-relevant —
// the same physiology WHOOP validated as affecting recovery and sleep.
// No Negative Zone: no judgment, no lecture, discreet by default.
// ─────────────────────────────────────────────────────────────────────────────

import { matchActivityInText } from './activity-catalog';
import { SEED_WEIGHTS } from './clarifier-weights';

export type ClarifierCategory =
  | 'intimacy'        // sexual activity — private, excluded from stress, recovery-relevant
  | 'excitement'      // positive life events — promotion, good news, celebration
  | 'exercise'        // unlogged workout, physical labor
  | 'heat'            // sauna, hot tub, sun exposure
  | 'stimulant'       // caffeine, pre-workout, nicotine
  | 'conflict'        // argument, confrontation — genuine stress, stays stress
  | 'illness'         // fever, infection onset
  | 'travel'          // flights, altitude, time zones
  | 'stress';         // confirmed stress — the member agrees with the read

export interface Clarification {
  category: ClarifierCategory;
  /** Excluded from the stress baseline — the spike was not distress. */
  excludeFromStressBaseline: boolean;
  /** Stored with a privacy flag — surfaces render it discreetly, never in shared views. */
  privateEntry: boolean;
  /** The reclassification line the member sees. */
  reclassLine: string;
  /** Recovery context, when the science carries one. */
  recoveryNote: string | null;
  /**
   * THE WEIGHT LAW (founder ruling 2026-08-03): a category with no number is
   * nothing to compute against. Magnitude = how hard the body moved (1–10).
   * Valence = which direction it moved the member (+1/0/−1). Two axes, never
   * one — a single scale collapses intimacy and conflict back into the same
   * number, which is the exact bug this file exists to fix. Seeds live in
   * lib/clarifier-weights.ts and are overwritten by the member's own
   * measured biosignal delta as instances accumulate.
   */
  magnitude: number;
  valence: 1 | 0 | -1;
  /** Why this weight exists, in plain language — WHY-FIRST law. */
  weightWhy: string;
}

const RULES: { cat: ClarifierCategory; test: RegExp }[] = [
  // Intimacy first — the member's words, plain or oblique, land here, never in stress.
  { cat: 'intimacy',   test: /\b(sex|sexual|intimacy|intimate|making love|made love|hooked up|romance|romantic (night|evening)|adult time|grown folks time|with my (wife|husband|partner|spouse))\b/i },
  { cat: 'excitement', test: /\b(excit|promot|approved|good news|celebrat|won|engaged|proposal|baby|birth|graduat)\w*/i },
  { cat: 'exercise',   test: /\b(work(ed)? ?out|lift|run|ran|sprint|hike|bike|training|gym|chores|ranch|shovel|chopp|mow)\w*/i },
  { cat: 'heat',       test: /\b(sauna|hot ?tub|steam|sun|heat|jacuzzi)\b/i },
  { cat: 'stimulant',  test: /\b(coffee|caffeine|espresso|energy drink|pre[- ]?workout|nicotine|cigar)\b/i },
  { cat: 'illness',    test: /\b(sick|fever|flu|cold|infection|ill)\b/i },
  { cat: 'travel',     test: /\b(flight|flew|airport|altitude|time ?zone|jet ?lag|drove all)\b/i },
  { cat: 'conflict',   test: /\b(argu|fight|confront|yell|screaming match)\w*/i },
];

function classifyBase(note: string): Omit<Clarification, 'magnitude' | 'valence' | 'weightWhy'> {
  const text = String(note ?? '').trim();
  let hit: ClarifierCategory | undefined = RULES.find(r => r.test.test(text))?.cat;

  // WHOOP-scale recognition: if the member names ANY of the 500+ catalog
  // activities, the spike files as exertion under that exact activity —
  // unless the intimacy rule already claimed it (intimacy always wins and
  // stays private).
  const matched = hit === 'intimacy' ? null : matchActivityInText(text);
  if (matched && matched.toLowerCase() === 'intimacy') { hit = 'intimacy'; }
  else if (matched && (!hit || hit === 'excitement' || hit === 'exercise')) {
    return {
      category: 'exercise',
      excludeFromStressBaseline: true,
      privateEntry: false,
      reclassLine: `Reclassified STRESS → EXERTION · ${matched} · counted as activity, not distress`,
      recoveryNote: `${matched} logged to today's activity picture — the membrane knows this one.`,
    };
  }
  if (!hit) hit = 'excitement';

  switch (hit) {
    case 'intimacy':
      return {
        category: 'intimacy',
        excludeFromStressBaseline: true,
        privateEntry: true,
        reclassLine: 'Reclassified STRESS → INTIMACY · excluded from stress baseline · private entry',
        recoveryNote: 'Logged as recovery-relevant context — timing can shape tonight’s sleep and tomorrow’s recovery. The membrane learns your pattern, privately.',
      };
    case 'excitement':
      return {
        category: 'excitement',
        excludeFromStressBaseline: true,
        privateEntry: false,
        reclassLine: 'Reclassified STRESS → EXCITEMENT · excluded from stress baseline',
        recoveryNote: 'Positive life event logged.',
      };
    case 'exercise':
      return {
        category: 'exercise',
        excludeFromStressBaseline: true,
        privateEntry: false,
        reclassLine: 'Reclassified STRESS → EXERTION · counted as activity, not distress',
        recoveryNote: 'Unlogged physical load added to today’s activity picture.',
      };
    case 'heat':
      return {
        category: 'heat',
        excludeFromStressBaseline: true,
        privateEntry: false,
        reclassLine: 'Reclassified STRESS → HEAT EXPOSURE · excluded from stress baseline',
        recoveryNote: 'Heat elevates heart rate without distress — noted.',
      };
    case 'stimulant':
      return {
        category: 'stimulant',
        excludeFromStressBaseline: true,
        privateEntry: false,
        reclassLine: 'Reclassified STRESS → STIMULANT RESPONSE · excluded from stress baseline',
        recoveryNote: 'Chemical Doctrine: timing and cumulative load tracked, never judged.',
      };
    case 'illness':
      return {
        category: 'illness',
        excludeFromStressBaseline: true,
        privateEntry: false,
        reclassLine: 'Reclassified STRESS → POSSIBLE ILLNESS · flagged for early awareness',
        recoveryNote: 'The immune system watches this one — early awareness, not fear.',
      };
    case 'travel':
      return {
        category: 'travel',
        excludeFromStressBaseline: true,
        privateEntry: false,
        reclassLine: 'Reclassified STRESS → TRAVEL LOAD · adjusted against travel baseline',
        recoveryNote: 'The vestibular system recalibrates — give it a night.',
      };
    case 'conflict':
    case 'stress':
    default:
      return {
        category: 'conflict',
        excludeFromStressBaseline: false,
        privateEntry: false,
        reclassLine: 'Confirmed as STRESS · counted toward stress load',
        recoveryNote: 'Closure before comfort — the loop closes when you log its end.',
      };
  }
}


/**
 * THE PUBLIC ENTRY — classification plus its weight.
 * Every clarification leaves this function carrying a number the membrane can
 * compute against, and the reason that number exists (WHY-FIRST law).
 */
export function classifyClarification(note: string): Clarification {
  const base = classifyBase(note);
  const seed = SEED_WEIGHTS[base.category];
  return { ...base, magnitude: seed.magnitude, valence: seed.valence, weightWhy: seed.why };
}
