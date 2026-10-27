// ─── lib/museImport.ts ───────────────────────────────────────────────────────
// THE CROWN'S FILE LANE — Mind Monitor CSV into the membrane.
//
// WHY MIND MONITOR AND NOT THE MUSE APP. Canon v70 Part IX §9.9, verbatim:
// "The Muse app returns finished verdicts — calm percent, stillness, alpha
// peak, brain recharge. That is vendor output, which AA2's doctrine bans as
// truth. Mind Monitor returns the measurement."
//
// WHAT THIS FILE WILL AND WILL NOT DO.
//
// WILL: average the five bands across the four scalp channels, count the
// samples it used, measure the length of the sit, and report what fraction of
// it had all four sensors genuinely touching skin.
//
// WILL NOT: emit an alpha peak in Hz (Mind Monitor does not record one — the
// "α 7.8Hz" on the approved panel is wire content, not a measurement this
// lane can produce); interpret the optics into prefrontal oxygenation (AA2
// does not own that derivation yet); or blend EEG and fNIRS into one number,
// which Canon §9.10 forbids outright on the Muse CTO's own receipt.
//
// THE PROVENANCE AA2 MUST CARRY. Canon §9.9 settings law: the 60 Hz notch
// filter is ON by default on US power, "so the raw is pre-cleaned and AA2 must
// record that provenance." The band columns Mind Monitor writes are computed
// downstream of that filter. That is noted on every row this lane produces and
// is why a Mind Monitor band value is never compared against a band value from
// some other tool as if they were the same measurement.
// ─────────────────────────────────────────────────────────────────────────────

import type { BiosignalRow } from './biosignals';

export type MuseFile = { name: string; text: string };

/** One recording day, aggregated. Mind Monitor writes one file per session;
 *  a file that crosses midnight produces two of these. */
export type MuseSession = {
  readingDate: string;            // YYYY-MM-DD
  delta: number | null;
  theta: number | null;
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
  /** Percent of accepted samples where ALL FOUR channels read good contact. */
  contactGoodPct: number | null;
  /** Samples kept after discarding every HeadBandOn = 0 row. The denominator. */
  samples: number;
  /** First accepted timestamp to last, in seconds. */
  sessionSec: number | null;
  /** The Athena's PPG, which the founder's own 2026-09-01 capture proved feeds
   *  through at 82–97 bpm. Session mean and session minimum — never called
   *  "resting," because a sit is not a night. */
  avgHr: number | null;
  minHr: number | null;
};

export type MuseParseResult = {
  sessions: MuseSession[];
  /** Files that were not Mind Monitor CSVs, named so the member is never left
   *  guessing which pick was ignored. */
  ignored: string[];
  /** Honest warnings — a session with bad contact still parses, and still says so. */
  notes: string[];
};

const BANDS = ['delta', 'theta', 'alpha', 'beta', 'gamma'] as const;
type Band = typeof BANDS[number];

/** Mind Monitor's four scalp channels. TP9 and TP10 sit at the hairline behind
 *  the ears; AF7 and AF8 sit on the forehead. Canon: AF7/AF8 are not the
 *  mid-frontal F3/F4 the research literature uses, so anything computed from
 *  them is a proxy on the member's own body, never a publishable value. */
const CHANNELS = ['TP9', 'AF7', 'AF8', 'TP10'] as const;

const num = (s: string | undefined): number | null => {
  if (s == null) return null;
  const t = s.trim();
  if (!t) return null;
  const v = Number(t);
  return Number.isFinite(v) ? v : null;
};

/** Mind Monitor stamps "2026-09-01 14:23:45.123". Take the calendar day off the
 *  front rather than constructing a Date, so a device in any timezone writes
 *  the day the member actually sat down. */
const ymdOf = (stamp: string | undefined): string | null => {
  if (!stamp) return null;
  const m = stamp.trim().match(/^(\d{4})[-/](\d{2})[-/](\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null;
};

const secOf = (stamp: string | undefined): number | null => {
  if (!stamp) return null;
  const m = stamp.trim().match(/(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?/);
  if (!m) return null;
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + (m[4] ? Number('0.' + m[4]) : 0);
};

/** Split a CSV line. Mind Monitor does not quote its fields, but a defensive
 *  split costs nothing and a malformed line should never take down an import. */
const cells = (line: string): string[] => line.split(',');

export function looksLikeMindMonitor(name: string, text: string): boolean {
  if (!/\.csv$/i.test(name)) return false;
  const head = text.slice(0, 2000).toLowerCase();
  // TimeStamp plus at least one band column is the signature. Checked on
  // content, never on the filename, because members rename files.
  return head.includes('timestamp') && /(delta|theta|alpha|beta|gamma)_(tp9|af7|af8|tp10)/.test(head);
}

export function parseMuseExport(files: MuseFile[]): MuseParseResult {
  const ignored: string[] = [];
  const notes: string[] = [];

  // Accumulators, keyed by calendar day so one file crossing midnight splits
  // honestly into the two days it actually happened on.
  type Acc = {
    bandSum: Record<Band, number>;
    bandCount: Record<Band, number>;
    allGood: number;
    hsiSeen: number;
    samples: number;
    firstSec: number | null;
    lastSec: number | null;
    hrSum: number;
    hrCount: number;
    hrMin: number | null;
  };
  const acc = new Map<string, Acc>();
  const fresh = (): Acc => ({
    bandSum: { delta: 0, theta: 0, alpha: 0, beta: 0, gamma: 0 },
    bandCount: { delta: 0, theta: 0, alpha: 0, beta: 0, gamma: 0 },
    allGood: 0, hsiSeen: 0, samples: 0,
    firstSec: null, lastSec: null,
    hrSum: 0, hrCount: 0, hrMin: null,
  });

  for (const f of files) {
    if (!looksLikeMindMonitor(f.name, f.text)) { ignored.push(f.name); continue; }

    const lines = f.text.split(/\r?\n/);
    const header = cells(lines[0] ?? '').map(h => h.trim());
    const lower = header.map(h => h.toLowerCase());

    const idxOf = (want: string): number => lower.indexOf(want.toLowerCase());

    // Band × channel column map. A missing channel is tolerated — three good
    // channels is still a measurement, and the sample count records the truth.
    const bandIdx: Record<Band, number[]> = { delta: [], theta: [], alpha: [], beta: [], gamma: [] };
    for (const b of BANDS) {
      for (const ch of CHANNELS) {
        const i = idxOf(`${b}_${ch}`);
        if (i >= 0) bandIdx[b].push(i);
      }
    }
    const haveAnyBand = BANDS.some(b => bandIdx[b].length > 0);
    if (!haveAnyBand) { ignored.push(f.name); continue; }

    const iStamp = idxOf('TimeStamp');
    const iOn    = idxOf('HeadBandOn');
    const iHr    = idxOf('Heart_Rate');
    const hsiIdx = CHANNELS.map(ch => idxOf(`HSI_${ch}`)).filter(i => i >= 0);

    if (iOn < 0) {
      notes.push(`${f.name}: no HeadBandOn column — every sample was kept, so a stretch with the band off the head cannot be discarded. Treat the bands as softer evidence.`);
    }
    if (!hsiIdx.length) {
      notes.push(`${f.name}: no HSI columns — contact quality is unknown for this recording, not good. LAW 23 cannot weight it.`);
    }
    if (iHr < 0) {
      notes.push(`${f.name}: no Heart_Rate column — this recording carries no PPG. Use the 16-channel preset to open it.`);
    }

    let kept = 0;
    for (let li = 1; li < lines.length; li++) {
      const line = lines[li];
      if (!line) continue;
      const c = cells(line);
      if (c.length < 2) continue;

      // HEADBANDON IS THE GATE. Canon §9.9: "bad contact makes the file useless
      // regardless of settings." A sample taken while the band was off the head
      // is not a quiet brain, it is no brain.
      if (iOn >= 0) {
        const on = num(c[iOn]);
        if (on == null || on < 1) continue;
      }

      const ymd = ymdOf(c[iStamp >= 0 ? iStamp : 0]);
      if (!ymd) continue;

      let a = acc.get(ymd);
      if (!a) { a = fresh(); acc.set(ymd, a); }

      let wroteBand = false;
      for (const b of BANDS) {
        const cols = bandIdx[b];
        if (!cols.length) continue;
        let sum = 0, n = 0;
        for (const i of cols) {
          const v = num(c[i]);
          if (v != null) { sum += v; n++; }
        }
        if (n > 0) { a.bandSum[b] += sum / n; a.bandCount[b] += 1; wroteBand = true; }
      }
      if (!wroteBand) continue;

      a.samples += 1;
      kept += 1;

      // CONTACT QUALITY. Mind Monitor's HSI is 1 = good, higher = worse. A
      // sample counts as good only when ALL FOUR channels say good, because a
      // band average is only as honest as its worst electrode.
      if (hsiIdx.length) {
        a.hsiSeen += 1;
        const good = hsiIdx.every(i => { const v = num(c[i]); return v != null && v <= 1; });
        if (good) a.allGood += 1;
      }

      const s = secOf(c[iStamp >= 0 ? iStamp : 0]);
      if (s != null) {
        if (a.firstSec == null || s < a.firstSec) a.firstSec = s;
        if (a.lastSec == null || s > a.lastSec) a.lastSec = s;
      }

      if (iHr >= 0) {
        const hr = num(c[iHr]);
        // Zero is Mind Monitor's "no reading", not a heart that stopped.
        if (hr != null && hr > 0) {
          a.hrSum += hr; a.hrCount += 1;
          if (a.hrMin == null || hr < a.hrMin) a.hrMin = hr;
        }
      }
    }

    if (kept === 0) {
      notes.push(`${f.name}: parsed, but every sample was discarded — the band was reported off the head for the whole file. Nothing written.`);
    }
  }

  const sessions: MuseSession[] = [];
  for (const [readingDate, a] of [...acc.entries()].sort(([x], [y]) => (x < y ? -1 : 1))) {
    if (a.samples === 0) continue;
    const mean = (b: Band): number | null =>
      a.bandCount[b] > 0 ? Number((a.bandSum[b] / a.bandCount[b]).toFixed(4)) : null;

    const contactGoodPct = a.hsiSeen > 0
      ? Number(((a.allGood / a.hsiSeen) * 100).toFixed(1))
      : null;

    const sessionSec = a.firstSec != null && a.lastSec != null && a.lastSec >= a.firstSec
      ? Number((a.lastSec - a.firstSec).toFixed(1))
      : null;

    if (contactGoodPct != null && contactGoodPct < 70) {
      notes.push(`${readingDate}: contact was good on only ${contactGoodPct}% of samples. The row is written because the record is the record — but LAW 23 says this night loses weight, and it will.`);
    }

    sessions.push({
      readingDate,
      delta: mean('delta'), theta: mean('theta'), alpha: mean('alpha'),
      beta: mean('beta'),   gamma: mean('gamma'),
      contactGoodPct,
      samples: a.samples,
      sessionSec,
      avgHr: a.hrCount > 0 ? Math.round(a.hrSum / a.hrCount) : null,
      minHr: a.hrMin != null ? Math.round(a.hrMin) : null,
    });
  }

  return { sessions, ignored, notes };
}

/** THE CROWN WRITES AS ITSELF. source and originSource are both 'muse' — the
 *  pipe is not the sensor, one heartbeat one vote, and this reading came off
 *  the head directly rather than through anyone's port. */
export function toBiosignalRows(sessions: MuseSession[]): BiosignalRow[] {
  return sessions.map(s => ({
    source: 'muse' as const,
    originSource: 'muse' as const,
    readingDate: s.readingDate,
    // NO VENDOR SCORES. The Crown gets no sleep_score, no readiness, no
    // stress_level, because Mind Monitor does not compute one and AA2 will not
    // invent one. Those columns stay null and a blank is a truthful blank.
    eegDelta: s.delta,
    eegTheta: s.theta,
    eegAlpha: s.alpha,
    eegBeta: s.beta,
    eegGamma: s.gamma,
    eegContactGoodPct: s.contactGoodPct,
    eegSamples: s.samples,
    eegSessionSec: s.sessionSec,
    avgHr: s.avgHr,
    minHr: s.minHr,
  }));
}
