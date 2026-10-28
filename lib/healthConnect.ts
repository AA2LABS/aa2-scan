// ─── lib/healthConnect.ts ────────────────────────────────────────────────────
// HEALTH CONNECT · THE SINGLE PORT · Canon §9.11
//
// Part XXI calls this "the largest remaining wire and the highest-leverage
// one." It is the item that turns Garmin, WHOOP and Oura from account exports
// into daily reads, and it is the reason the control panel's PORT row has been
// reporting CLOSED.
//
// ── WHY THE PORT ENFORCES THE VENDOR-OUTPUT BAN STRUCTURALLY ────────────────
// Health Connect defines data types for RAW MEASUREMENT ONLY: HRV as RMSSD in
// milliseconds, resting heart rate, sleep sessions with stages, SpO2,
// respiratory rate, VO2 max, skin temperature, steps, exercise sessions.
//
// It has NO data type for "Recovery %", "Readiness", "Body Battery" or any
// other vendor verdict. Those opinions have nowhere to live in the pipe.
// Reading from Health Connect makes it structurally impossible to ingest a
// vendor score by accident — not a rule to remember, a constraint the pipe
// itself enforces.
//
// ── LAW 23 · ONE DOOR, NOT TEN WITNESSES ────────────────────────────────────
// Founder, 2026-09-04: "it's also the exact same data repeated in a different
// location... You all have the same shit!" So every record that comes through
// here carries its ORIGIN — the app that wrote it — and AA2 keeps one row per
// origin per day. The pipe is not the sensor. One heartbeat, one vote.
//
// ── HONEST CONSTRAINTS, STATED NOT HIDDEN ───────────────────────────────────
// 1. THIS REQUIRES A NATIVE BUILD. Health Connect permissions are declared in
//    the Android manifest and wired through an Expo config plugin. An OTA
//    update cannot turn this on. Until that build ships, isAvailable() returns
//    false and every caller degrades to the file lane — which still works.
// 2. DEPTH THROUGH THE PORT MAY BE THINNER than a direct vendor API for some
//    instruments. The locked shape: Health Connect as the daily river for the
//    whole stack, with direct APIs retained only where finer resolution is
//    genuinely required. DO NOT rip out the Oura, Garmin and Strava paths —
//    they are the depth layer beneath the port.
// 3. UNVERIFIED AND FLAGGED: whether Garmin writes raw HRV RMSSD (as opposed
//    to withholding it along with "HRV status"), and whether Garmin Connect
//    writes BLOOD PRESSURE to Health Connect on Android at all. Both must be
//    checked in the Health Connect data browser on the founder's own phone
//    before the port is treated as complete. NEVER STATE A DEVICE CAPABILITY
//    WITHOUT THE RECEIPT.
//
// THE MODULE IS LOADED LAZILY AND DEFENSIVELY so this file compiles and runs
// in a build that does not have the native side yet. Nothing here throws on a
// phone without Health Connect; it reports closed and gets out of the way.

import type { BiosignalRow, BiosignalSource } from './biosignals';

/** The only record types AA2 asks for. Every one is raw measurement. */
export const READ_TYPES = [
  'HeartRateVariabilityRmssd',
  'RestingHeartRate',
  'SleepSession',
  'OxygenSaturation',
  'RespiratoryRate',
  'Vo2Max',
  'SkinTemperature',
  'Steps',
  'ExerciseSession',
  // Canon §9.11 names these two specifically: Sexual Activity maps to the
  // Clarifier's intimacy category and its private-by-default handling, and
  // Mindfulness is where Muse sessions land.
  'SexualActivity',
  'MindfulnessSession',
] as const;
export type ReadType = typeof READ_TYPES[number];

type HCModule = {
  initialize: () => Promise<boolean>;
  getSdkStatus: () => Promise<number>;
  requestPermission: (p: { accessType: 'read'; recordType: string }[]) => Promise<unknown[]>;
  getGrantedPermissions: () => Promise<{ recordType: string; accessType: string }[]>;
  readRecords: (t: string, o: any) => Promise<{ records: any[] }>;
};

let mod: HCModule | null = null;
let tried = false;

/** Load the native module if this build has it. Never throws. */
function load(): HCModule | null {
  if (tried) return mod;
  tried = true;
  try {
    // Not a static import: a build without the native side must still boot.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    mod = require('react-native-health-connect') as HCModule;
  } catch { mod = null; }
  return mod;
}

export type PortStatus = {
  available: boolean;
  initialized: boolean;
  granted: ReadType[];
  missing: ReadType[];
  /** WHY-FIRST — the row on the sensing face reads this, never a bare flag. */
  line: string;
};

export async function portStatus(): Promise<PortStatus> {
  const m = load();
  if (!m) {
    return {
      available: false, initialized: false, granted: [], missing: [...READ_TYPES],
      line: 'CLOSED · NEEDS NATIVE BUILD — Health Connect is declared in the Android manifest and cannot be switched on over the air.',
    };
  }
  try {
    const initialized = await m.initialize();
    if (!initialized) {
      return { available: true, initialized: false, granted: [], missing: [...READ_TYPES],
        line: 'Health Connect is on this phone but did not initialise. Open the Health Connect app once, then return.' };
    }
    const have = await m.getGrantedPermissions();
    const granted = READ_TYPES.filter(t => have.some(p => p.recordType === t && p.accessType === 'read'));
    const missing = READ_TYPES.filter(t => !granted.includes(t));
    return {
      available: true, initialized: true, granted, missing,
      line: granted.length === 0
        ? 'Health Connect is ready and AA2 has no permissions yet. One tap opens the whole stack.'
        : `OPEN · ${granted.length} of ${READ_TYPES.length} channels permitted.`,
    };
  } catch (e: any) {
    return { available: true, initialized: false, granted: [], missing: [...READ_TYPES],
      line: `Health Connect error: ${String(e?.message ?? e)}` };
  }
}

/**
 * THE THIRTY-DAY FLOOR. Health Connect hands back only the last 30 days unless
 * READ_HEALTH_DATA_HISTORY is granted on top of the channel permissions. It is
 * declared in the Android manifest beside the eleven channels, and it is asked
 * for HERE — but in a call of its own.
 *
 * Why its own call: requestPermission is all-or-nothing. On a phone whose
 * Health Connect is too old to know this permission, putting it in the same
 * array as the eleven channels throws, and the member ends up with NOTHING
 * permitted because of one line AA2 added for depth. The channels are asked
 * first and kept; history is asked second and is allowed to fail.
 *
 * AA2 DOES NOT CLAIM IT. getGrantedPermissions() in react-native-health-connect
 * reverse-maps the channel permissions and the two special cases for exercise
 * route and background access — it has no case for history, so a granted
 * history permission never comes back over the bridge. There is no receipt, so
 * there is no claim: the readout says what the floor is, not what was allowed.
 */
export const HISTORY_PERMISSION = 'ReadHealthDataHistory' as const;

export async function requestAccess(): Promise<PortStatus> {
  const m = load();
  if (!m) return portStatus();
  try {
    await m.initialize();
    await m.requestPermission(READ_TYPES.map(recordType => ({ accessType: 'read' as const, recordType })));
  } catch { /* the member declining is a valid answer, not an error */ }
  try {
    await m.requestPermission([{ accessType: 'read' as const, recordType: HISTORY_PERMISSION }]);
  } catch { /* an older Health Connect does not know this one. The eleven stand. */ }
  return portStatus();
}

/** Health Connect names the writing app. That name is the ORIGIN, not AA2. */
function originOf(rec: any): BiosignalSource {
  const pkg = String(rec?.metadata?.dataOrigin ?? rec?.metadata?.dataOrigin?.packageName ?? '').toLowerCase();
  if (pkg.includes('whoop'))  return 'whoop';
  if (pkg.includes('garmin')) return 'garmin';
  if (pkg.includes('oura'))   return 'oura';
  if (pkg.includes('strava')) return 'strava';
  if (pkg.includes('muse') || pkg.includes('interaxon')) return 'muse';
  // AN UNKNOWN WRITER IS NOT GUESSED INTO A BRAND. It lands as 'manual' —
  // something a human can see and correct — rather than being silently
  // attributed to an instrument that may not have written it.
  return 'manual';
}

const ymd = (v: any): string | null => {
  const s = String(v ?? '');
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
};
const min = (ms: number) => Math.round(ms / 60000);

/**
 * READ THE RIVER. One row per ORIGIN per DAY — never one row per record, and
 * never a blend across writers. If three apps wrote the same night, AA2 keeps
 * three rows and the spread table shows them arguing. That is the product.
 */
export async function readRange(days = 30): Promise<BiosignalRow[]> {
  const m = load();
  if (!m) return [];
  const end = new Date();
  const start = new Date(Date.now() - days * 86400_000);
  const filter = { timeRangeFilter: { operator: 'between', startTime: start.toISOString(), endTime: end.toISOString() } };

  const byKey = new Map<string, BiosignalRow>();
  const put = (src: BiosignalSource, date: string | null, patch: Partial<BiosignalRow>) => {
    if (!date) return;
    const k = `${src}|${date}`;
    const cur = byKey.get(k) ?? { source: src, originSource: src, readingDate: date };
    for (const [kk, vv] of Object.entries(patch)) if (vv != null) (cur as any)[kk] = vv;
    byKey.set(k, cur);
  };
  const safeRead = async (t: ReadType) => {
    try { return (await m.readRecords(t, filter)).records ?? []; } catch { return []; }
  };

  for (const r of await safeRead('HeartRateVariabilityRmssd')) {
    put(originOf(r), ymd(r.time ?? r.startTime), { hrv: Number(r.heartRateVariabilityMillis ?? r.hrvRmssd) });
  }
  for (const r of await safeRead('RestingHeartRate')) {
    put(originOf(r), ymd(r.time ?? r.startTime), { restingHr: Number(r.beatsPerMinute) });
  }
  for (const r of await safeRead('OxygenSaturation')) {
    put(originOf(r), ymd(r.time ?? r.startTime), { spo2Avg: Number(r.percentage?.value ?? r.percentage) });
  }
  for (const r of await safeRead('RespiratoryRate')) {
    put(originOf(r), ymd(r.time ?? r.startTime), { respirationAvg: Number(r.rate) });
  }
  for (const r of await safeRead('Vo2Max')) {
    // MARKED AS THE ESTIMATE IT IS, always.
    put(originOf(r), ymd(r.time ?? r.startTime), { vo2max: Number(r.vo2MillilitersPerMinuteKilogram), vo2maxEstimated: true });
  }
  for (const r of await safeRead('SkinTemperature')) {
    const d = r.delta?.inCelsius ?? r.baseline?.inCelsius ?? null;
    if (d != null) put(originOf(r), ymd(r.startTime ?? r.time), { skinTempDelta: Number(d) });
  }
  for (const r of await safeRead('SleepSession')) {
    const date = ymd(r.endTime ?? r.startTime);
    const src = originOf(r);
    const total = r.startTime && r.endTime
      ? min(new Date(r.endTime).getTime() - new Date(r.startTime).getTime()) : null;
    let deep = 0, rem = 0, light = 0, awake = 0, any = false;
    for (const st of (r.stages ?? [])) {
      const d = min(new Date(st.endTime).getTime() - new Date(st.startTime).getTime());
      const t = Number(st.stage);
      any = true;
      // Health Connect stage codes: 5 deep · 6 REM · 4 light · 1 awake.
      if (t === 5) deep += d; else if (t === 6) rem += d; else if (t === 4) light += d; else if (t === 1) awake += d;
    }
    put(src, date, {
      bedtimeStart: r.startTime ?? null, bedtimeEnd: r.endTime ?? null,
      timeInBedMin: total,
      totalSleepMin: any ? deep + rem + light : total,
      deepMin: any ? deep : null, remMin: any ? rem : null,
      lightMin: any ? light : null, awakeMin: any ? awake : null,
    });
  }

  return [...byKey.values()].sort((a, b) => a.readingDate.localeCompare(b.readingDate));
}

/** Read the river and write it into the membrane through the normal door. */
export async function syncHealthConnect(days = 30): Promise<{ ok: boolean; days: number; message: string }> {
  const st = await portStatus();
  if (!st.available) return { ok: false, days: 0, message: st.line };
  if (!st.initialized || st.granted.length === 0) {
    return { ok: false, days: 0, message: 'Health Connect has not granted AA2 any channels yet. Tap CONNECT and approve the reads.' };
  }
  const rows = await readRange(days);
  if (!rows.length) {
    return { ok: false, days: 0, message: 'The port is open and empty — no app has written a reading in this window.' };
  }
  const { upsertThroughPort } = await import('./biosignals-port');
  return upsertThroughPort(rows);
}
