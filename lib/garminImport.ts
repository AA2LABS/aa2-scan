import { EncodingType, readAsStringAsync } from 'expo-file-system/legacy';

export type GarminImportResult = {
  daysImported: number;
  summary: string;
};

/**
 * ─── lib/garminImport.ts ────────────────────────────────────────────────────
 * GARMIN — AND AN HONEST ACCOUNT OF WHAT THIS LANE IS NOT.
 *
 * AUDIT 2026-08-21, founder order "FIND ANY SHORTCUTS." This file was the
 * worst thing in the repo: it reported thirty days imported for a file it
 * never opened. That is fixed and logged, not erased — see the FIT branch.
 *
 * WHAT IS TRUE TODAY, stated before anyone finds it:
 *   · JSON exports are counted, not imported. This function returns a DAY
 *     COUNT and writes NOTHING. There is no insert, no upsert, nothing
 *     touching biosignal_readings anywhere in this file.
 *   · Nothing in the app calls it. It is not wired to a door.
 *   · FIT is binary and AA2 has no decoder for it.
 *
 * WHAT IT TAKES TO MAKE THIS A REAL LANE: the founder's own Garmin export,
 * read once, so the parser is written against the actual column headers the
 * way lib/whoopImport.ts and lib/ouraExport.ts were — both verified line by
 * line against his real files. A parser written against headers nobody has
 * seen is a guess, and a guess does not get to write to the membrane.
 * ────────────────────────────────────────────────────────────────────────────
 */
export async function parseGarminExport(
  uri: string,
  name: string
): Promise<GarminImportResult> {
  const lower = name.toLowerCase();
  const isJson = lower.endsWith('.json');
  const isFit = lower.endsWith('.fit');
  const isZip = lower.endsWith('.zip');

  if (isZip) {
    return {
      daysImported: 0,
      summary:
        'Zip archives are not parsed in-app yet. Extract .fit or .json from the export and upload those files.',
    };
  }

  if (isJson) {
    try {
      const txt = await readAsStringAsync(uri, { encoding: EncodingType.UTF8 });
      const j = JSON.parse(txt) as unknown;
      const days = estimateJsonDays(j);
      return {
        daysImported: days,
        summary: `Parsed JSON export — estimated ${days} day(s) of records.`,
      };
    } catch {
      return { daysImported: 0, summary: 'Could not parse JSON export.' };
    }
  }

  if (isFit) {
    // CORRECTION 2026-08-21 — WHAT WAS HERE WAS A GUESS DRESSED AS AN IMPORT.
    //
    // Two failures, both removed:
    //   1. With no API key it returned `daysImported: 30` and called it a
    //      "placeholder 30-day import". It parsed nothing. Thirty was invented.
    //   2. With an API key it sent 120KB of base64 to a language model and
    //      asked it to ESTIMATE how many calendar days were in the file. An
    //      estimate is not a measurement. A number AA2 cannot show its work
    //      for is a number AA2 does not report.
    //
    // NEVER MANUFACTURE A DOCTRINE. The same law governs a number.
    //
    // AA2 has no FIT decoder. Until it has one that reads real records off the
    // wire, this lane says so and writes nothing. Garmin's own export produces
    // CSV and JSON, and those lanes are real.
    return {
      daysImported: 0,
      summary:
        'FIT is a binary format and AA2 has no decoder for it yet — nothing was read and nothing was written. ' +
        'Garmin Connect → Account → Export Your Data produces CSV and JSON; those import for real.',
    };
  }

  return { daysImported: 0, summary: 'Unsupported file type.' };
}

function estimateJsonDays(j: unknown): number {
  if (Array.isArray(j)) {
    return new Set(
      j.map(x => {
        if (x && typeof x === 'object' && 'day' in x && typeof (x as { day: unknown }).day === 'string') {
          return (x as { day: string }).day.slice(0, 10);
        }
        return '';
      }).filter(Boolean)
    ).size;
  }
  if (j && typeof j === 'object') {
    const o = j as Record<string, unknown>;
    if (typeof o.day === 'string') return 1;
    for (const v of Object.values(o)) {
      const n = estimateJsonDays(v);
      if (n > 0) return n;
    }
  }
  return 0;
}
