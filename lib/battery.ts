// ─── lib/battery.ts ──────────────────────────────────────────────────────────
// BATTERY ON THE SENSING FACE · LAW 9 · owed since 2026-09-04
//
// Founder, 2026-09-04: "humans panic when the umbilical cord of connection to
// the world is about to die, so that's been high priority of my entire design,
// battery protection and awareness."
//
// The amendment closed with: "The LIVE READOUT row today shows mark, dot, name
// and on/off, and no charge. A battery field per instrument belongs on the
// sensing face, SPEAKING ONLY WHEN THE OUTCOME CAN CHANGE. It is a wire, not a
// rewire, and it waits for the founder's word." This is that wire.
//
// ── THE THREE LAWS THIS FILE IS BUILT AGAINST ───────────────────────────────
//
// 1. SILENCE-FIRST. "Speaking only when the outcome can change" is not a
//    style note, it is the spec. A battery at 86% changes nothing, so it says
//    nothing. The field appears when the number would alter what the member
//    does next — charge it, or go.
//
// 2. NEVER STATE A DEVICE CAPABILITY WITHOUT THE RECEIPT. "Which instruments
//    can report it is a per-device receipt through the standard Bluetooth
//    Battery Service; NONE IS ASSUMED." So this file stores only what
//    something actually told AA2. There is no inference, no decay model, no
//    "probably around half." An instrument that has never reported its charge
//    has no battery field at all, and that blank is truthful.
//
// 3. THE SERIAL IS THE TIMESTAMP — and so is the reading. Every charge value
//    carries when it was observed, because a battery level from four days ago
//    is not a battery level, it is a memory.

import { supabase } from './supabase';
import { logMembraneEvent } from './db';

/** Below this, the charge can change what the member does next. */
export const SPEAK_BELOW = 30;
/** Below this it is not advice, it is the session ending. */
export const CRITICAL_BELOW = 10;
/** Past this age a reading is a memory, not a state. */
export const STALE_AFTER_HOURS = 18;

export type BatteryReading = {
  deviceKey: string;
  percent: number;
  observedAt: string;          // ISO
  /** Where the number came from. No number enters without one. */
  source: 'ble' | 'mind_monitor' | 'vendor_export' | 'by_hand';
};

export type BatteryState = {
  percent: number;
  observedAt: string;
  source: BatteryReading['source'];
  ageHours: number;
  stale: boolean;
  /** THE ONLY QUESTION THAT MATTERS: should this row say anything at all? */
  speaks: boolean;
  level: 'critical' | 'low' | 'fine';
  /** WHY-FIRST. Never a naked percentage. */
  line: string;
};

export async function recordBattery(r: BatteryReading): Promise<boolean> {
  if (!Number.isFinite(r.percent) || r.percent < 0 || r.percent > 100) return false;
  try {
    logMembraneEvent({
      eventType: 'device_battery',
      sourceScreen: 'biobuddy',
      subject: r.deviceKey,
      value: { percent: Math.round(r.percent), observedAt: r.observedAt, source: r.source },
    });
    return true;
  } catch { return false; }
}

/** Latest charge per instrument, from what instruments actually reported. */
export async function getBatteryStates(): Promise<Record<string, BatteryState>> {
  const out: Record<string, BatteryState> = {};
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return out;
    const since = new Date(Date.now() - 14 * 86400_000).toISOString();
    const { data, error } = await supabase
      .from('membrane_events')
      .select('subject, value, created_at')
      .eq('member_id', user.id)
      .eq('event_type', 'device_battery')
      .gte('created_at', since)
      .order('created_at', { ascending: true });
    if (error || !data) return out;

    for (const e of data as any[]) {
      const key = String(e.subject ?? '');
      const pct = Number(e.value?.percent);
      if (!key || !Number.isFinite(pct)) continue;
      const observedAt = String(e.value?.observedAt ?? e.created_at);
      out[key] = buildState(pct, observedAt, (e.value?.source ?? 'by_hand') as BatteryReading['source']);
    }
    return out;
  } catch { return out; }
}

export function buildState(percent: number, observedAt: string, source: BatteryReading['source']): BatteryState {
  const ageHours = Math.max(0, (Date.now() - new Date(observedAt).getTime()) / 3_600_000);
  const stale = ageHours > STALE_AFTER_HOURS;
  const level: BatteryState['level'] =
    percent <= CRITICAL_BELOW ? 'critical' : percent <= SPEAK_BELOW ? 'low' : 'fine';

  // SILENCE-FIRST. A healthy charge is not news, and a stale reading is not a
  // state — neither one earns a word on the sensing face.
  const speaks = level !== 'fine' && !stale;

  const line = stale
    ? `Last seen at ${Math.round(percent)}% about ${Math.round(ageHours)} hours ago. That is a memory, not a charge — wake the instrument to know.`
    : level === 'critical'
      ? `${Math.round(percent)}%. This will not finish tonight. Charge it before the session, not after.`
      : level === 'low'
        ? `${Math.round(percent)}%. Enough for now, not enough for a full night. Top it off before bed.`
        : `${Math.round(percent)}%.`;

  return { percent: Math.round(percent), observedAt, source, ageHours, stale, speaks, level, line };
}

/**
 * BE AWARE ASKS THE QUESTION BEFORE THE DOOR — Spoke 9, restored with LAW 19.
 * "AA2 asks me a simple question: how long do you plan to be out? I give it a
 * time range, and it immediately tells me whether my watch, ring, glasses and
 * phone are good to go — or if something needs to be topped off."
 *
 * GO or TOP OFF. Per instrument, never a single verdict for the whole stack,
 * because the member leaves with the ones that are ready.
 */
export function readinessFor(
  hoursOut: number,
  states: Record<string, BatteryState>,
  deviceKeys: string[],
): { deviceKey: string; verdict: 'GO' | 'TOP OFF' | 'UNKNOWN'; why: string }[] {
  return deviceKeys.map(deviceKey => {
    const st = states[deviceKey];
    if (!st || st.stale) {
      return { deviceKey, verdict: 'UNKNOWN' as const,
        why: 'AA2 has not been told this instrument’s charge. No guess is made — wake it, or log it by hand.' };
    }
    // A deliberately crude rule, stated plainly rather than dressed up: every
    // instrument in the stack is assumed to want roughly ten hours for a full
    // night, which is the Crown's own cell. No per-device drain model exists
    // and inventing one would be a capability claim with no receipt.
    const needed = Math.min(100, Math.ceil((hoursOut / 10) * 100));
    return st.percent >= needed
      ? { deviceKey, verdict: 'GO' as const, why: `${st.percent}% against roughly ${needed}% needed for ${hoursOut}h out.` }
      : { deviceKey, verdict: 'TOP OFF' as const, why: `${st.percent}% against roughly ${needed}% needed for ${hoursOut}h out. Top it off.` };
  });
}
