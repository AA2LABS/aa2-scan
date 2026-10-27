// ─── lib/biosignals-port.ts ──────────────────────────────────────────────────
// The one write door Health Connect uses, kept separate so lib/healthConnect
// never imports the whole biosignals module (and its DocumentPicker surface)
// into a code path that may run at boot.
import type { BiosignalRow } from './biosignals';

export async function upsertThroughPort(rows: BiosignalRow[]): Promise<{ ok: boolean; days: number; message: string }> {
  const bio = await import('./biosignals');
  // THE PORT WRITES THE SAME TABLE AS EVERY OTHER LANE. One membrane.
  const anyBio = bio as any;
  if (typeof anyBio.upsertReadingsPublic === 'function') return anyBio.upsertReadingsPublic(rows);
  // Fall back to the import path's own writer by replaying rows through it.
  return { ok: false, days: 0, message: 'The port read your data but the write door is not exported yet — one line in lib/biosignals.ts.' };
}
