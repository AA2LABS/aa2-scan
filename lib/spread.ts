// ─── lib/spread.ts ───────────────────────────────────────────────────────────
// LAW 23 · ONE DOOR, NOT TEN WITNESSES · DISAGREEMENT IS THE DATA
//
// Founder, 2026-09-04: "How do I get them to disagree? Why do you need a
// watch, a WHOOP and an Oura if they all give identical baselines?... I'm
// trying to see what's the data variation so my Clarifier is accurate."
//
// And the law it produced: "The Clarifier's accuracy comes from the spread,
// not the average: the same night, one row per channel, one column per
// instrument that reads it, and the delta on the end."
//
// WHY THIS SCREEN HAS TO EXIST. Every vendor rounds its raw signal into a
// score before the member sees it, and the port de-duplicates on the way in.
// The instruments already disagree every night — what hides it is that nobody
// ever puts the columns side by side. Canon: "The spread table is the screen
// that turns YOUR STACK HAS YOU COVERED from a checkmark into the proof."
//
// WHAT IS NEVER DONE HERE: the values are never averaged. One heartbeat, one
// vote — an average would erase exactly the finding this screen exists to
// show.

import { supabase } from './supabase';
import type { BiosignalSource } from './biosignals';

export type SpreadChannel = {
  key: string;
  label: string;
  unit: string;
  /** Lower spread is better agreement for every channel AA2 tracks. */
  tight: number;   // at or below this, the instruments agree
  loose: number;   // at or above this, the night is a finding
};

/** Only raw measurement. A recovery score is an opinion and opinions cannot
 *  disagree in any way worth measuring. */
export const CHANNELS: SpreadChannel[] = [
  { key: 'hrv_rmssd',      label: 'HRV',          unit: 'ms',  tight: 3,  loose: 8  },
  { key: 'resting_hr',     label: 'Resting HR',   unit: 'bpm', tight: 2,  loose: 5  },
  { key: 'total_sleep_min',label: 'Sleep',        unit: 'min', tight: 15, loose: 35 },
  { key: 'deep_min',       label: 'Deep',         unit: 'min', tight: 15, loose: 35 },
  { key: 'rem_min',        label: 'REM',          unit: 'min', tight: 15, loose: 35 },
  { key: 'awake_min',      label: 'Awake',        unit: 'min', tight: 10, loose: 25 },
  { key: 'respiration_avg',label: 'Respiration',  unit: 'br',  tight: 0.5,loose: 1.5},
  { key: 'spo2_avg',       label: 'SpO₂',         unit: '%',   tight: 1,  loose: 3  },
  { key: 'skin_temp_delta',label: 'Temp Δ',       unit: '°',   tight: 0.2,loose: 0.6},
];

export type SpreadCell = { source: BiosignalSource; value: number };
export type SpreadRow = {
  channel: SpreadChannel;
  cells: SpreadCell[];
  /** max − min across the instruments that answered. null when fewer than two did. */
  delta: number | null;
  /** 'agree' · 'watch' · 'finding' — never 'good' or 'bad'. Measured, not judged. */
  band: 'agree' | 'watch' | 'finding' | 'single';
  /** WHY-FIRST: the row explains itself. */
  why: string;
};

export type SpreadNight = {
  readingDate: string;
  sources: BiosignalSource[];
  rows: SpreadRow[];
  /** The room, when the Ozlo answered. The tiebreaker for a temperature argument. */
  room?: { tempC?: number | null; light?: number | null; noiseDb?: number | null; pressure?: number | null };
};

const bandFor = (delta: number, c: SpreadChannel): SpreadRow['band'] =>
  delta <= c.tight ? 'agree' : delta >= c.loose ? 'finding' : 'watch';

const NAMES: Record<string, string> = {
  garmin: 'Garmin', oura: 'Oura', whoop: 'WHOOP', beats: 'Beats',
  muse: 'Muse', ozlo: 'Ozlo', strava: 'Strava', manual: 'By hand',
};
export const sourceLabel = (s: string) => NAMES[s] ?? s;

/**
 * THE NIGHT, COLUMN BY COLUMN. One row per channel, one column per instrument
 * that actually reported it, and the delta on the end.
 */
export async function getSpreadNight(readingDate?: string): Promise<SpreadNight | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  let ymd = readingDate;
  if (!ymd) {
    // THE MOST RECENT NIGHT THE STACK ACTUALLY ARGUED ABOUT — the latest date
    // carrying more than one source. A night only one instrument saw has
    // nothing to disagree with and is not what this screen is for.
    const { data: recent } = await supabase
      .from('biosignal_readings')
      .select('reading_date, source')
      .eq('member_id', user.id)
      .order('reading_date', { ascending: false })
      .limit(120);
    const byDay = new Map<string, Set<string>>();
    for (const r of (recent ?? []) as any[]) {
      const s = byDay.get(r.reading_date) ?? new Set<string>();
      s.add(r.source); byDay.set(r.reading_date, s);
    }
    for (const [d, s] of byDay) { if (s.size > 1) { ymd = d; break; } }
    if (!ymd && byDay.size) ymd = [...byDay.keys()][0];
  }
  if (!ymd) return null;

  const cols = ['source', ...CHANNELS.map(c => c.key), 'room_temp_c', 'room_light', 'room_noise_db', 'room_pressure'].join(', ');
  const { data, error } = await supabase
    .from('biosignal_readings')
    .select(cols)
    .eq('member_id', user.id)
    .eq('reading_date', ymd);
  if (error || !data?.length) return null;

  const sources = (data as any[]).map(r => r.source as BiosignalSource);
  const rows: SpreadRow[] = CHANNELS.map(channel => {
    const cells: SpreadCell[] = [];
    for (const r of data as any[]) {
      const v = r[channel.key];
      if (v != null && Number.isFinite(Number(v))) cells.push({ source: r.source, value: Number(v) });
    }
    if (cells.length === 0) {
      return { channel, cells, delta: null, band: 'single',
        why: `No instrument in your stack reported ${channel.label} on this night. A blank is a truthful blank.` };
    }
    if (cells.length === 1) {
      return { channel, cells, delta: null, band: 'single',
        why: `Only ${sourceLabel(cells[0].source)} reads ${channel.label} on your stack. One witness cannot disagree — this row is a reading, not a finding.` };
    }
    const vals = cells.map(c => c.value);
    const delta = Math.round((Math.max(...vals) - Math.min(...vals)) * 100) / 100;
    const band = bandFor(delta, channel);
    const hi = cells.reduce((a, b) => (b.value > a.value ? b : a));
    const lo = cells.reduce((a, b) => (b.value < a.value ? b : a));
    const why = band === 'agree'
      ? `${cells.length} instruments inside ${delta}${channel.unit} of each other. That is agreement, and agreement is the control.`
      : band === 'watch'
        ? `${sourceLabel(hi.source)} reads ${delta}${channel.unit} above ${sourceLabel(lo.source)}. Worth a look at contact and placement before it is called a finding.`
        : `${sourceLabel(hi.source)} and ${sourceLabel(lo.source)} are ${delta}${channel.unit} apart on one body, one night. **That is the finding.** Check contact, placement and charge state for this session.`;
    return { channel, cells, delta, band, why };
  });

  const r0 = (data as any[])[0];
  const room = (data as any[]).find(r => r.room_temp_c != null || r.room_noise_db != null) ?? r0;

  return {
    readingDate: ymd,
    sources: [...new Set(sources)],
    rows,
    room: room ? {
      tempC: room.room_temp_c ?? null, light: room.room_light ?? null,
      noiseDb: room.room_noise_db ?? null, pressure: room.room_pressure ?? null,
    } : undefined,
  };
}
