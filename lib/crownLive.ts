// ─── lib/crownLive.ts ────────────────────────────────────────────────────────
// THE CROWN, LIVE · Canon §9.9's top rung
//
// "TWO PATHS INTO AA2: CSV export via BYOB upload, or OSC STREAMING OVER
//  WI-FI to an IP and port on the local network — real-time EEG into the
//  membrane, never touching a cloud. That is the top rung."
//
// The CSV lane (lib/museImport.ts) shows your last recording. This shows your
// brain now. Nothing else in AA2 streams — every other row on the readout is
// last night's number.
//
// ── WHY A RELAY AND NOT A SOCKET IN THE APP ─────────────────────────────────
// Mind Monitor emits OSC over UDP. React Native has no UDP socket, so catching
// it in the app directly means a native module and therefore a native build.
// React Native DOES have WebSocket. So a tiny relay on the member's own
// machine listens for the UDP and re-serves it as WebSocket on the LAN, and
// this client reads that — which ships OVER THE AIR, with no native build and
// no cloud in the path. The relay is tools/crown-relay.js.
//
// When the native UDP module or the Muse SDK lands, only the transport below
// changes. Everything downstream of onSample stays exactly as it is.
//
// ── THE RAW NEVER TOUCHES DISK ──────────────────────────────────────────────
// Minus7 KILL 3, carried into AA2: raw data is never stored. A stream is 256
// values a second and it belongs in memory, rendered as it arrives. When the
// sit ends, ONE summary row is written — the same shape lib/museImport.ts
// produces from a CSV. The parser became the summariser; nothing was wasted.

import { toBiosignalRows, type MuseSession } from './museImport';

export type CrownSample = {
  at: number;                  // ms epoch
  delta: number; theta: number; alpha: number; beta: number; gamma: number;
  /** 0–100 · share of channels reporting good contact at this instant. */
  contact: number | null;
  heartRate: number | null;
  headbandOn: boolean;
  battery: number | null;
};

export type CrownLiveState = {
  connected: boolean;
  samples: number;
  startedAt: number | null;
  last: CrownSample | null;
  /** Rolling relative theta share, 0–100 — the number the readout row shows. */
  thetaPct: number | null;
  contactPct: number | null;
  /** WHY-FIRST. The row never shows a figure without this behind it. */
  line: string;
};

type Listener = (s: CrownLiveState) => void;

const BANDS = ['delta', 'theta', 'alpha', 'beta', 'gamma'] as const;

/** Relative theta out of total band power. Mind Monitor emits Bels (log10),
 *  so each band returns to linear with 10^v before the share is taken. The
 *  derivation lives in code the founder can read, not inside a column. */
export function thetaShare(s: Pick<CrownSample, 'delta'|'theta'|'alpha'|'beta'|'gamma'>): number | null {
  const lin = BANDS.map(b => Math.pow(10, Number(s[b])));
  if (lin.some(v => !Number.isFinite(v))) return null;
  const total = lin.reduce((a, b) => a + b, 0);
  if (!(total > 0)) return null;
  return Math.round((lin[1] / total) * 100);
}

class CrownLive {
  private ws: WebSocket | null = null;
  private listeners = new Set<Listener>();
  private acc = { delta: 0, theta: 0, alpha: 0, beta: 0, gamma: 0, n: 0, good: 0, hsiSeen: 0, hrSum: 0, hrN: 0, hrMin: null as number | null };
  private state: CrownLiveState = {
    connected: false, samples: 0, startedAt: null, last: null,
    thetaPct: null, contactPct: null,
    line: 'Not streaming. Start the relay and point Mind Monitor at this machine.',
  };

  subscribe(fn: Listener) { this.listeners.add(fn); fn(this.state); return () => { this.listeners.delete(fn); }; }
  private emit() { for (const fn of this.listeners) fn(this.state); }
  get snapshot() { return this.state; }

  /** url: ws://<relay-ip>:8787 — the member's own LAN. Never a cloud host. */
  connect(url: string) {
    this.disconnect();
    try {
      const ws = new WebSocket(url);
      this.ws = ws;
      ws.onopen = () => {
        this.acc = { delta: 0, theta: 0, alpha: 0, beta: 0, gamma: 0, n: 0, good: 0, hsiSeen: 0, hrSum: 0, hrN: 0, hrMin: null };
        this.state = { ...this.state, connected: true, samples: 0, startedAt: Date.now(),
          line: 'Streaming. Nothing is being written — the raw never touches disk.' };
        this.emit();
      };
      ws.onmessage = (ev: any) => {
        let s: CrownSample;
        try { s = JSON.parse(String(ev.data)); } catch { return; }
        // HEADBANDON IS THE GATE. A sample taken with the band off the head
        // is not a quiet brain, it is no brain.
        if (!s.headbandOn) return;
        this.ingest(s);
      };
      ws.onerror = () => {
        this.state = { ...this.state, connected: false,
          line: 'The relay did not answer. Check that it is running and that the phone is on the same Wi-Fi.' };
        this.emit();
      };
      ws.onclose = () => {
        this.state = { ...this.state, connected: false, line: 'Stream closed.' };
        this.emit();
      };
    } catch (e: any) {
      this.state = { ...this.state, connected: false, line: `Could not open the stream: ${String(e?.message ?? e)}` };
      this.emit();
    }
  }

  private ingest(s: CrownSample) {
    const a = this.acc;
    for (const b of BANDS) a[b] += Number(s[b]) || 0;
    a.n += 1;
    if (s.contact != null) { a.hsiSeen += 1; if (s.contact >= 100) a.good += 1; }
    if (s.heartRate != null && s.heartRate > 0) {
      a.hrSum += s.heartRate; a.hrN += 1;
      if (a.hrMin == null || s.heartRate < a.hrMin) a.hrMin = s.heartRate;
    }
    const contactPct = a.hsiSeen > 0 ? Math.round((a.good / a.hsiSeen) * 100) : null;
    const theta = thetaShare(s);

    // LAW 23 ON A LIVE WIRE. Under 70% good contact the bands are not a
    // weaker measurement — they are not a measurement, and the row refuses
    // the number rather than lending a bad sit the authority of a figure.
    const usable = contactPct == null || contactPct >= 70;

    this.state = {
      connected: true, samples: a.n, startedAt: this.state.startedAt, last: s,
      thetaPct: usable ? theta : null,
      contactPct,
      line: usable
        ? `Live · ${a.n} samples · ${contactPct ?? '—'}% good contact. Nothing stored until you stop.`
        : `LOW CONTACT · ${contactPct}%. Reseat the band — these bands are not a measurement.`,
    };
    this.emit();
  }

  /** Stop, and write ONE summary row. The sit becomes a record; the raw does not. */
  async stopAndSummarise(): Promise<{ ok: boolean; message: string }> {
    const a = this.acc;
    const started = this.state.startedAt;
    this.disconnect();
    if (a.n === 0 || !started) {
      return { ok: false, message: 'Nothing to write — no accepted samples in that session.' };
    }
    const sessionSec = Math.round((Date.now() - started) / 1000);
    const mean = (b: typeof BANDS[number]) => Number((a[b] / a.n).toFixed(4));
    const session: MuseSession = {
      readingDate: new Date(started).toISOString().slice(0, 10),
      delta: mean('delta'), theta: mean('theta'), alpha: mean('alpha'),
      beta: mean('beta'), gamma: mean('gamma'),
      contactGoodPct: a.hsiSeen > 0 ? Number(((a.good / a.hsiSeen) * 100).toFixed(1)) : null,
      samples: a.n,
      sessionSec,
      avgHr: a.hrN > 0 ? Math.round(a.hrSum / a.hrN) : null,
      minHr: a.hrMin != null ? Math.round(a.hrMin) : null,
    };
    const { upsertReadingsPublic } = await import('./biosignals');
    const res = await upsertReadingsPublic(toBiosignalRows([session]));
    const len = sessionSec >= 90 ? `${Math.round(sessionSec / 60)} min` : `${sessionSec} sec`;
    return {
      ok: res.ok,
      message: res.ok
        ? `Sit recorded · ${len} · ${a.n} samples · ${session.contactGoodPct ?? '—'}% good contact. The raw was never written.`
        : res.message,
    };
  }

  disconnect() {
    try { this.ws?.close(); } catch { /* already gone */ }
    this.ws = null;
    if (this.state.connected) { this.state = { ...this.state, connected: false }; this.emit(); }
  }
}

export const crownLive = new CrownLive();
