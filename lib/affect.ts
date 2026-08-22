/**
 * ─── lib/affect.ts ──────────────────────────────────────────────────────────
 * THE EXCITEMENT WIRE — AA2 acknowledges what the vendors explain away.
 *
 * FOUNDER ORDER 2026-08-21:
 *   "I want to wire that in and explain it and not explain it away like he
 *    just did. So if someone does upload a video with excitement or voice with
 *    excitement or text with excitement, and they're wearing their crown, I
 *    want AA2 to acknowledge that excitement via the correct wire."
 *   "We know that it's there. It's just never been wired, and we're gonna be
 *    the first to wire it."
 *
 * ── THE RECEIPT THIS IS BUILT ON ───────────────────────────────────────────
 * Muse's own coach, Enso, to the founder at 07:29 AM on 2026-08-21, verbatim:
 *
 *   "While Muse EEG primarily tracks brainwave patterns related to attention,
 *    calmness, and mental states, it doesn't directly detect adrenaline or
 *    specific neurochemicals like that. However, certain brainwave patterns
 *    can reflect heightened arousal or alertness, SUCH AS INCREASED BETA
 *    WAVES, which often correlate with active thinking, focus, or emotional
 *    excitement."
 *
 *   "If you felt some adrenaline-like energy, it might show as more variable
 *    or active EEG signals rather than the calm, steady patterns seen in deep
 *    relaxation."
 *
 * The vendor named the band. The vendor described the signature. The vendor's
 * own app then offered the founder two follow-up chips — "What brainwaves
 * indicate excitement?" and "How does Muse detect arousal?" — questions it
 * suggests and will not answer against his own night.
 *
 * IT IS NOT MISSING. IT IS UNWIRED. This file is the wire.
 *
 * ── THE SPLIT THAT MAKES IT HONEST ─────────────────────────────────────────
 * EEG gives AROUSAL. It cannot give VALENCE.
 *
 * An excited brain and an anxious brain both run hot — beta up, the trace
 * variable and active rather than calm and steady. The instrument reports the
 * volume. It cannot name the song.
 *
 * THE MEMBER NAMES THE SONG. That is not a limitation AA2 apologises for; it
 * is the architecture. Enso deflected precisely because it held arousal with
 * no valence and had nowhere to put it. AA2 takes valence from the member,
 * arousal from the Crown, and joins them.
 *
 *   THE CROWN CAN TELL YOU THE VOLUME. ONLY YOU CAN TELL IT THE SONG.
 *
 * ── WHAT AA2 WILL NEVER DO HERE ────────────────────────────────────────────
 *   · Never overrule the member. If he says he was excited, he was excited.
 *     The instrument corroborates or fails to corroborate. It never contradicts.
 *   · Never diagnose an emotion from a waveform. Beta is arousal, full stop.
 *   · Never go silent when the Crown was not worn. It says what the Crown
 *     COULD have added and that it is not there — Representative Doctrine.
 *   · Never call a night "bad" when the member has told it why the night was
 *     hard. A night degraded by joy is not a degraded night.
 * ────────────────────────────────────────────────────────────────────────────
 */

/** How the member told AA2. All three land in the same lane. */
export type AffectKind = 'text' | 'voice' | 'video';

/**
 * The member's own word for the state. VALENCE ONLY — AA2 never infers this
 * from a waveform. High-arousal states are marked so the wire knows which
 * declarations the Crown can speak to at all.
 */
export type AffectState =
  | 'excited' | 'enthusiastic' | 'anxious' | 'angry' | 'stressed'   // high arousal
  | 'calm' | 'content' | 'sad' | 'flat';                            // low arousal

export const HIGH_AROUSAL: AffectState[] = ['excited', 'enthusiastic', 'anxious', 'angry', 'stressed'];

/** Positive valence at high arousal — the states nobody built a category for. */
export const POSITIVE_HIGH_AROUSAL: AffectState[] = ['excited', 'enthusiastic'];

export function isHighArousal(s: AffectState): boolean { return HIGH_AROUSAL.includes(s); }
export function isJoy(s: AffectState): boolean { return POSITIVE_HIGH_AROUSAL.includes(s); }

export type DeclaredAffect = {
  id?: string;
  kind: AffectKind;
  state: AffectState;
  /** The member's own words, kept verbatim. AA2 quotes, never paraphrases. */
  quote: string;
  /** When the member says the state applied — not when they typed it. */
  windowStart: string;   // ISO
  windowEnd: string;     // ISO
  /** The night this window belongs to, YYYY-MM-DD. */
  readingDate: string;
  declaredAt: string;    // ISO
};

/**
 * ── THE CROWN READING ──────────────────────────────────────────────────────
 * HONEST LIMIT, STATED BEFORE ANYONE FINDS IT: Muse publishes no export and no
 * public API. AA2 has no live Crown lane and does not pretend to. What Muse
 * DOES give the member is the post-session powerband screen, on their own
 * phone, showing the bands for that session.
 *
 * So the Crown's lane is ARCHIVE, entered by the member from their own screen
 * — the same move the app designer in the Crown dossier made by hand, feeding
 * screenshots to an AI because nothing joined them for him.
 *
 * `betaRelative` is beta as a share of the session's own total power, or the
 * member's own reading off that screen. It is compared ONLY against the
 * member's other Crown sessions. Never against a population.
 */
export type CrownReading = {
  sessionStart: string;  // ISO
  sessionEnd: string;    // ISO
  readingDate: string;   // YYYY-MM-DD
  betaRelative: number | null;
  alphaRelative: number | null;
  thetaRelative: number | null;
  gammaRelative: number | null;
  deltaRelative: number | null;
  /** Provenance. The pipe is not the sensor. */
  source: 'muse_post_session_manual';
  enteredAt: string;
};

/* ── the join ─────────────────────────────────────────────────────────────── */

export type Corroboration =
  | 'CORROBORATED'      // member said high arousal, the Crown ran hot
  | 'NOT_CORROBORATED'  // member said high arousal, the Crown ran calm
  | 'NO_CROWN'          // the Crown was not on, or no reading was entered
  | 'NOT_APPLICABLE';   // the declared state is not one EEG arousal speaks to

export type ExcitementFinding = {
  affect: DeclaredAffect;
  crown: CrownReading | null;
  corroboration: Corroboration;
  /** Beta against the member's own Crown history, 0-100. Null if unknowable. */
  betaPercentile: number | null;
  crownSessions: number;
  /** Plain sentences. No naked numbers, no vendor verdict, no diagnosis. */
  lines: string[];
};

function overlaps(a: { s: string; e: string }, b: { s: string; e: string }): boolean {
  const as = Date.parse(a.s), ae = Date.parse(a.e), bs = Date.parse(b.s), be = Date.parse(b.e);
  if ([as, ae, bs, be].some(n => Number.isNaN(n))) return false;
  return as <= be && bs <= ae;
}

function percentile(v: number, series: number[]): number | null {
  const s = series.filter(x => Number.isFinite(x)).sort((a, b) => a - b);
  if (!s.length) return null;
  let below = 0;
  for (const x of s) { if (x < v) below++; }
  return Math.round((below / s.length) * 100);
}

/** Elevated means elevated FOR THIS MEMBER. There is no population here. */
const ELEVATED_PCT = 65;
const CALM_PCT = 35;
const MIN_CROWN_SESSIONS = 3;

/**
 * THE WIRE. Takes what the member said, the Crown session that overlaps it,
 * and the member's own Crown history — and says what the two of them agree on.
 */
export function wireExcitement(
  affect: DeclaredAffect,
  crownHistory: CrownReading[]
): ExcitementFinding {
  const lines: string[] = [];

  // The Crown session that was actually running while the member felt it.
  const crown = crownHistory.find(c =>
    overlaps({ s: c.sessionStart, e: c.sessionEnd }, { s: affect.windowStart, e: affect.windowEnd })
  ) ?? null;

  // AA2 quotes the member first. Always. The declaration is the finding; the
  // instrument is the corroboration.
  lines.push(`You said it: "${affect.quote.trim()}"`);

  if (!isHighArousal(affect.state)) {
    lines.push(
      `AA2 is holding that as ${affect.state}. The Crown reads AROUSAL — how loud the brain is running — so it has nothing to add to a low-arousal state. That is a limit of the instrument, not a doubt about you.`
    );
    return { affect, crown, corroboration: 'NOT_APPLICABLE', betaPercentile: null, crownSessions: crownHistory.length, lines };
  }

  if (!crown || crown.betaRelative == null) {
    // NEVER GO SILENT. Say what the Crown could have added, and that it isn't
    // here. This is the sentence Enso should have said and didn't.
    lines.push(
      `The Crown has no reading over that window, so AA2 cannot corroborate it — and it will not pretend the night explains itself without one.`,
      `What the Crown WOULD add: Muse's own coach names the band. Increased BETA reflects heightened arousal — "active thinking, focus, or emotional excitement" — and shows up as a more variable, active trace rather than the calm steady one of deep relaxation. That is measured, recorded and displayed on your post-session screen. It has simply never been joined to your night. Enter that session's bands and AA2 joins them.`
    );
    return { affect, crown, corroboration: 'NO_CROWN', betaPercentile: null, crownSessions: crownHistory.length, lines };
  }

  const series = crownHistory
    .filter(c => c !== crown && typeof c.betaRelative === 'number')
    .map(c => c.betaRelative as number);
  const pct = series.length ? percentile(crown.betaRelative, series) : null;

  if (pct == null || series.length < MIN_CROWN_SESSIONS) {
    lines.push(
      `Your Crown ran that window, but with ${series.length} other session${series.length === 1 ? '' : 's'} on record AA2 has no honest yardstick for what a high beta night looks like FOR YOU yet. It is holding the reading, not ranking it.`,
      `A vendor score is a population's opinion of you. A baseline is you — and yours is still being built.`
    );
    return { affect, crown, corroboration: 'NO_CROWN', betaPercentile: null, crownSessions: crownHistory.length, lines };
  }

  if (pct >= ELEVATED_PCT) {
    lines.push(
      `Your Crown agrees. Beta over that window sat above ${pct}% of your own recorded sessions — the loud, variable trace, not the calm steady one.`,
      `AA2 will not go further than that, and here is exactly why: BETA IS AROUSAL. It says the brain was running hot. It cannot say excited or anxious — those look the same to an electrode. ${isJoy(affect.state) ? 'You named it as excitement, so excitement is what it was.' : `You named it as ${affect.state}, so ${affect.state} is what it was.`} The instrument gave the volume. You gave the song.`
    );
    if (isJoy(affect.state)) {
      lines.push(
        `So this is on the record as a night with a named cause. If the numbers came in low, they are not a verdict on you — they are the price of something that was worth it. A night degraded by joy is not a degraded night.`
      );
    }
    return { affect, crown, corroboration: 'CORROBORATED', betaPercentile: pct, crownSessions: crownHistory.length, lines };
  }

  if (pct <= CALM_PCT) {
    // THE MEMBER IS NEVER OVERRULED. This is a disagreement, reported as one.
    lines.push(
      `Your Crown does not corroborate it. Beta over that window sat below ${100 - pct}% of your own sessions — the calm steady trace, not the active one.`,
      `That is a DISAGREEMENT, not a correction. You remain the ground truth: you were there and the electrode was only listening. Worth knowing rather than worth arguing — a headband can sit badly, a session can end before the feeling did, and the window AA2 was given may not be the window you meant.`
    );
    return { affect, crown, corroboration: 'NOT_CORROBORATED', betaPercentile: pct, crownSessions: crownHistory.length, lines };
  }

  lines.push(
    `Your Crown is neutral on it. Beta over that window sat mid-range for you — neither the loud trace nor the calm one. It neither backs you up nor argues.`,
    `AA2 says so plainly rather than rounding it into agreement.`
  );
  return { affect, crown, corroboration: 'NOT_CORROBORATED', betaPercentile: pct, crownSessions: crownHistory.length, lines };
}

/**
 * THE RULING, applied to a night.
 * Returns the sentence that must lead any report on a night the member has
 * already explained — so the membrane never opens with a verdict on a night
 * whose cause is already known.
 */
export function nightCauseLine(affects: DeclaredAffect[], readingDate: string): string | null {
  const own = affects.filter(a => a.readingDate === readingDate);
  if (!own.length) return null;
  const joy = own.find(a => isJoy(a.state));
  if (joy) {
    return `You told AA2 why this night was different: ${joy.state}. Whatever the numbers say below, they are the cost of something you chose — not a mark against you.`;
  }
  const hi = own.find(a => isHighArousal(a.state));
  if (hi) {
    return `You told AA2 this night carried ${hi.state}. The numbers below are read with that standing in front of them, not behind them.`;
  }
  return `You logged how this night felt — ${own[0].state}. AA2 reads the numbers with your account first.`;
}
