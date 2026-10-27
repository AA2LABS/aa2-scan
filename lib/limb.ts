// ─── lib/limb.ts ─────────────────────────────────────────────────────────────
// THE LIMB CONFLICT RULE · the Garmin Index BPM, and physics
//
// THE MANUAL, VERBATIM, Health Warnings page 1:
//   "Do not use this device on the same limb as another health monitoring
//    device."
//
// AND THE SECOND-ORDER EFFECT THE MANUAL DOES NOT SPELL OUT BUT PHYSICS DOES:
// a cuff inflating to occlude the brachial artery INVALIDATES ANY OPTICAL
// SENSOR DOWNSTREAM ON THAT SAME LIMB for the duration of the measurement. A
// wrist device on the BPM arm will produce garbage for that minute.
//
// THE FOUNDER'S STACK HAS NO CLEAN ARM. Garmin Tactix 8 on one wrist, WHOOP on
// the other arm, and the Index BPM is an upper-arm cuff. One of them comes off
// for the reading, or its value for that window has to be marked invalid.
//
// Canon's own conclusion: "a `bp_measurement` event must flag the affected
// limb's other sensors as INVALID for the measurement window. That is a
// Clarifier data-hygiene rule." This is that rule.
//
// WHY INVALID AND NOT DELETED. The Regime Law: an overturned reading becomes
// history, not the standard. The row stays, carrying the reason it should not
// be trusted, so the record is readable and nothing silently disappears.

import { supabase } from './supabase';
import { logMembraneEvent } from './db';

export type Limb = 'left_arm' | 'right_arm' | 'left_wrist' | 'right_wrist' | 'left_ankle' | 'right_ankle' | 'torso' | 'head' | 'finger_left' | 'finger_right';

/** Which limb an instrument sits on. Declared, never inferred. */
export type LimbPlacement = { deviceKey: string; limb: Limb };

/** Cuff inflation blocks flow DOWNSTREAM. Upstream and the other side are fine. */
const DOWNSTREAM: Record<string, Limb[]> = {
  left_arm:  ['left_wrist', 'finger_left'],
  right_arm: ['right_wrist', 'finger_right'],
};

/** Default placements for the founder's stack, per LAW 22's head-to-toe order. */
export const DEFAULT_PLACEMENT: LimbPlacement[] = [
  { deviceKey: 'garmin_index_bpm', limb: 'left_arm' },
  { deviceKey: 'whoop_mg',         limb: 'right_arm' },
  { deviceKey: 'garmin_tactix_8',  limb: 'left_wrist' },
  { deviceKey: 'oura_ring_4',      limb: 'finger_left' },
  { deviceKey: 'apollo',           limb: 'left_ankle' },
  { deviceKey: 'muse_s_athena',    limb: 'head' },
  { deviceKey: 'beats_pro_2',      limb: 'head' },
];

export type LimbConflict = {
  cuffLimb: Limb;
  /** Instruments that must be ignored for the measurement window. */
  invalidated: string[];
  /** Instruments that are clear and can be trusted through it. */
  clear: string[];
  /** Whether the member has any arm with nothing optical downstream. */
  hasCleanArm: boolean;
  /** WHY-FIRST. */
  line: string;
};

/**
 * THE CHECK, RUN BEFORE A CUFF READING. Answers one question: what can you
 * still believe while this cuff is inflated?
 */
export function conflictFor(cuffLimb: Limb, placement: LimbPlacement[] = DEFAULT_PLACEMENT): LimbConflict {
  const downstream = DOWNSTREAM[cuffLimb] ?? [];
  const invalidated: string[] = [];
  const clear: string[] = [];
  for (const p of placement) {
    if (p.deviceKey === 'garmin_index_bpm') continue;
    // Same limb, or anything the cuff is upstream of.
    if (p.limb === cuffLimb || downstream.includes(p.limb)) invalidated.push(p.deviceKey);
    else clear.push(p.deviceKey);
  }
  const otherArm: Limb = cuffLimb === 'left_arm' ? 'right_arm' : 'left_arm';
  const otherDown = DOWNSTREAM[otherArm] ?? [];
  const hasCleanArm = !placement.some(p =>
    p.deviceKey !== 'garmin_index_bpm' && (p.limb === otherArm || otherDown.includes(p.limb)));

  const line = invalidated.length === 0
    ? 'Nothing optical is downstream of this cuff. Every other instrument stays trustworthy through the reading.'
    : `While this cuff is inflated, ${invalidated.length === 1 ? 'one instrument is' : `${invalidated.length} instruments are`} downstream of an occluded artery and cannot be believed for that minute: ${invalidated.join(', ')}. Their rows are kept and marked, never deleted.`;

  return { cuffLimb, invalidated, clear, hasCleanArm, line };
}

/**
 * RECORD THE READING AND THE SHADOW IT CASTS, in one event. The Clarifier and
 * the spread table read `invalidated` and drop those instruments' weight for
 * the window — for that window only, never for good.
 */
export async function logBpMeasurement(input: {
  systolic: number; diastolic: number; pulse?: number | null;
  cuffLimb?: Limb; windowSeconds?: number; placement?: LimbPlacement[];
}): Promise<{ ok: boolean; conflict: LimbConflict; message: string }> {
  const cuffLimb = input.cuffLimb ?? 'left_arm';
  const conflict = conflictFor(cuffLimb, input.placement);
  const startedAt = new Date().toISOString();
  const windowSeconds = input.windowSeconds ?? 120;

  try {
    logMembraneEvent({
      eventType: 'bp_measurement',
      sourceScreen: 'biobuddy',
      subject: 'garmin_index_bpm',
      value: {
        systolic: input.systolic, diastolic: input.diastolic, pulse: input.pulse ?? null,
        cuffLimb, startedAt, windowSeconds,
        invalidated: conflict.invalidated,
        // NO NAKED NUMBERS — the shadow travels with the reading that cast it.
        why: conflict.line,
      },
    });
    return { ok: true, conflict, message: conflict.line };
  } catch (e: any) {
    return { ok: false, conflict, message: String(e?.message ?? e) };
  }
}

/** Windows in which a given instrument should not be believed. */
export async function invalidWindowsFor(deviceKey: string, days = 30): Promise<{ from: string; to: string; why: string }[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    const since = new Date(Date.now() - days * 86400_000).toISOString();
    const { data, error } = await supabase
      .from('membrane_events')
      .select('value, occurred_at')
      .eq('user_id', user.id)
      .eq('event_type', 'bp_measurement')
      .gte('occurred_at', since);
    if (error || !data) return [];
    const out: { from: string; to: string; why: string }[] = [];
    for (const e of data as any[]) {
      const inv: string[] = e.value?.invalidated ?? [];
      if (!inv.includes(deviceKey)) continue;
      const from = String(e.value?.startedAt ?? e.occurred_at);
      const to = new Date(new Date(from).getTime() + (Number(e.value?.windowSeconds) || 120) * 1000).toISOString();
      out.push({ from, to, why: String(e.value?.why ?? 'Downstream of an inflated cuff.') });
    }
    return out;
  } catch { return []; }
}

/**
 * THE HARD RESTRICTIONS, FROM THE MANUAL. Predesignation's fourth line —
 * WHAT IT DOES NOT DO — stated up front and unprompted, because Door Two is
 * the family door and covers six lives including children.
 */
export const INDEX_BPM_RESTRICTIONS = [
  'Do not use under age 18.',
  'Do not use over age 75.',
  'Left arm circumference must be between 22 cm and 42 cm.',
  'Do not use if pregnant, possibly pregnant, or experiencing preeclampsia or toxemia.',
  'Do not use if you have a pacemaker or other internal electronic device.',
  'Do not use on the same limb as another health monitoring device.',
] as const;

/** Whether AA2 may recommend or read this instrument for a given member. */
export function bpmPermittedFor(age: number | null | undefined): { permitted: boolean; why: string } {
  if (age == null) {
    return { permitted: false, why: 'The membrane does not know this member’s age, and the Index BPM has hard age limits in its own manual. AA2 will not recommend it until it does.' };
  }
  if (age < 18) return { permitted: false, why: 'The Index BPM manual prohibits use under 18. This instrument is not offered on a child’s channel.' };
  if (age > 75) return { permitted: false, why: 'The Index BPM manual prohibits use over 75.' };
  return { permitted: true, why: 'Within the manufacturer’s stated age range. The remaining restrictions still apply and are shown at Predesignation.' };
}
