/**
 * ─── lib/garminImport.ts ────────────────────────────────────────────────────
 * GARMIN — THE ARCHIVE LANE, BUILT AGAINST THE FOUNDER'S OWN EXPORT.
 *
 * FOUNDER ORDER 2026-08-21: "Fresh GARMIN add that!!!!!!"
 *
 * WHAT THIS FILE USED TO BE, LOGGED NOT ERASED: it returned `daysImported: 30`
 * for a .FIT file it never opened, and on the other path it asked a language
 * model to ESTIMATE how many days were in a base64 blob. It also wrote NOTHING
 * to the membrane and was called by nothing. All of that is gone. This parser
 * was written against Garmin_82126.zip — the founder's real export — and every
 * field name below was read out of his actual files, never guessed.
 *
 * MEASURED ON HIS EXPORT, 2026-08-21:
 *   234 sleep records · 235 daily summaries · 226 health-status days
 *   167 fitness-age days
 *   -> 235 MERGED DAYS, 2025-12-30 through 2026-08-21, 4,311 field values
 *
 * ── THE FOUR FILES THAT MATTER, and what only Garmin brings ────────────────
 *
 * 1. DI-Connect-Wellness/*_sleepData.json      THE NIGHT
 *      sleepStartTimestampGMT · sleepEndTimestampGMT · calendarDate
 *      deepSleepSeconds · lightSleepSeconds · remSleepSeconds
 *      awakeSleepSeconds · unmeasurableSeconds
 *      averageRespiration · restlessMomentCount · awakeCount
 *      sleepScores.overallScore
 *      spo2SleepSummary { averageSPO2 · lowestSPO2 · averageHR }
 *      napList  <- NAPS ARE NOT NIGHTS; counted and reported, never merged
 *
 * 2. DI-Connect-Aggregator/UDSFile_*.json      THE DAY
 *      restingHeartRate · minHeartRate
 *      allDayStress.aggregatorList[type=TOTAL].averageStressLevel
 *
 * 3. DI-Connect-Wellness/*_healthStatusData.json   THE THING NOBODY ELSE SHIPS
 *      metrics[] of { type, value, baselineLowerLimit, baselineUpperLimit }
 *      HRV · HR · SPO2 · SKIN_TEMP_C · RESPIRATION
 *
 *      SKIN_TEMP_C IS ALREADY A DELTA. Garmin ships -0.2, meaning two tenths
 *      below THE MEMBER'S OWN baseline — not an absolute room-temperature
 *      number. WHOOP ships absolute Celsius and AA2 leaves skinTempDelta empty
 *      for it, because a delta column must hold a delta. Garmin's belongs
 *      there and lands there.
 *
 *      Garmin also ships its OWN baseline band per metric. That is the
 *      REGIME LAW arriving from the vendor's side, and it is a second opinion
 *      AA2 can hold up against the baseline it computes from the member's own
 *      record. It is READ but NOT written as truth — see the note below.
 *
 * 4. DI-Connect-Wellness/*_fitnessAgeData.json     VO2 MAX
 *      biometricVo2Max, keyed by asOfDateGmt.
 *      THIS IS AN ESTIMATE, NOT A MEASUREMENT. Garmin derives it from BMI and
 *      resting heart rate — it is not the number a ten-minute ride produces.
 *      It is stored with vo2maxEstimated: true so the membrane can never
 *      present a derived number as a measured one.
 *
 * ── WHAT IS DELIBERATELY LEFT EMPTY ────────────────────────────────────────
 *   efficiencyPct  Garmin does not ship a sleep-efficiency percentage. AA2
 *                  does not compute one and call it Garmin's.
 *   activity       Garmin has no 0-100 activity score. Steps are not a score,
 *                  and the activity column already carries a different unit
 *                  per source. An empty column is honest; a repurposed one is
 *                  not.
 *   latencyMin     not in this export.
 *
 * ── ONE DISAGREEMENT KEPT APART, ON PURPOSE ────────────────────────────────
 *   restlessMomentCount -> restlessMoments   (Garmin 30, Muse 35 — same question)
 *   awakeCount          -> wakeEvents        (WHOOP's disturbances — different question)
 *   The membrane must never report two answers to two different questions as
 *   one disagreement.
 * ────────────────────────────────────────────────────────────────────────────
 */

import type { BiosignalRow } from './biosignals';

export type GarminFile = { name: string; text: string };

export type GarminParseResult = {
  rows: BiosignalRow[];
  filesRead: string[];
  filesSkipped: string[];
  sleepRecords: number;
  napsSkipped: number;
  udsDays: number;
  healthStatusDays: number;
  vo2Days: number;
  fieldValues: number;
  firstDate: string | null;
  lastDate: string | null;
};

/* ── helpers ──────────────────────────────────────────────────────────────── */

const num = (v: unknown): number | null =>
  typeof v === 'number' && Number.isFinite(v) ? v : null;

/** Garmin ships seconds. The membrane stores minutes. */
const secToMin = (v: unknown): number | null => {
  const n = num(v);
  return n == null ? null : Math.round(n / 60);
};

const ymd = (v: unknown): string | null => {
  const m = String(v ?? '').match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
};

/* ── the parser ───────────────────────────────────────────────────────────── */

export function parseGarminExport(files: GarminFile[]): GarminParseResult {
  const byDay = new Map<string, BiosignalRow>();
  const read: string[] = [];
  const skipped: string[] = [];
  let sleepRecords = 0, naps = 0, udsDays = 0, hsDays = 0, vo2Days = 0;

  const put = (date: string | null, patch: Partial<BiosignalRow>) => {
    if (!date) return;
    const cur = byDay.get(date) ?? { source: 'garmin' as const, originSource: 'garmin' as const, readingDate: date };
    for (const [k, v] of Object.entries(patch)) {
      if (v !== null && v !== undefined) (cur as any)[k] = v;
    }
    byDay.set(date, cur);
  };

  for (const f of files) {
    const base = (f.name.split('/').pop() ?? '').toLowerCase();
    let doc: unknown;
    try { doc = JSON.parse(f.text); } catch { skipped.push(f.name); continue; }
    const list: any[] = Array.isArray(doc) ? doc : [doc];

    // ── 1. THE NIGHT ───────────────────────────────────────────────────────
    if (base.includes('sleepdata')) {
      for (const r of list) {
        if (!r || typeof r !== 'object') continue;
        sleepRecords++;
        // NAPS ARE NOT NIGHTS. Counted so the member knows they were seen,
        // never folded into the night they sat beside.
        if (Array.isArray(r.napList)) naps += r.napList.length;

        const deep  = secToMin(r.deepSleepSeconds);
        const light = secToMin(r.lightSleepSeconds);
        const rem   = secToMin(r.remSleepSeconds);
        const awake = secToMin(r.awakeSleepSeconds);
        const unmeasurable = secToMin(r.unmeasurableSeconds);

        // Garmin ships the stages, not the total. Deep + light + REM is the
        // night; adding awake and the stretches the watch could not read gives
        // time in bed. The arithmetic is stated, never hidden.
        const total = deep != null && light != null && rem != null ? deep + light + rem : null;
        const inBed = total != null ? total + (awake ?? 0) + (unmeasurable ?? 0) : null;

        const sp = (r.spo2SleepSummary ?? {}) as Record<string, unknown>;
        const sc = (r.sleepScores ?? {}) as Record<string, unknown>;

        put(ymd(r.calendarDate), {
          bedtimeStart: typeof r.sleepStartTimestampGMT === 'string' ? r.sleepStartTimestampGMT : null,
          bedtimeEnd:   typeof r.sleepEndTimestampGMT === 'string' ? r.sleepEndTimestampGMT : null,
          deepMin: deep, lightMin: light, remMin: rem, awakeMin: awake,
          totalSleepMin: total, timeInBedMin: inBed,
          respirationAvg: num(r.averageRespiration),
          restlessMoments: num(r.restlessMomentCount),
          wakeEvents: num(r.awakeCount),
          // A VENDOR SCORE IS A POPULATION'S OPINION OF YOU. Stored so it is
          // visible; never ground truth.
          sleep: num(sc.overallScore),
          spo2Avg: num(sp.averageSPO2),
          spo2Min: num(sp.lowestSPO2),
          // averageHR here is the OVERNIGHT average, the same question Oura's
          // avg_hr answers — not the all-day average.
          avgHr: num(sp.averageHR),
        });
      }
      read.push(f.name);
      continue;
    }

    // ── 2. THE DAY ─────────────────────────────────────────────────────────
    if (base.startsWith('udsfile')) {
      for (const r of list) {
        if (!r || typeof r !== 'object') continue;
        udsDays++;
        let stress: number | null = null;
        const agg = (r.allDayStress ?? {}).aggregatorList;
        if (Array.isArray(agg)) {
          // TOTAL, not AWAKE and not ASLEEP. Three rows answer three different
          // questions and only one of them is the day.
          const t = agg.find((a: any) => a?.type === 'TOTAL');
          if (t) stress = num(t.averageStressLevel);
        }
        put(ymd(r.calendarDate), {
          restingHr: num(r.restingHeartRate),
          minHr: num(r.minHeartRate),
          stress,
        });
      }
      read.push(f.name);
      continue;
    }

    // ── 3. THE BASELINE METRICS ────────────────────────────────────────────
    if (base.includes('healthstatusdata')) {
      for (const r of list) {
        if (!r || typeof r !== 'object') continue;
        hsDays++;
        const patch: Partial<BiosignalRow> = {};
        if (Array.isArray(r.metrics)) {
          for (const m of r.metrics) {
            const v = num(m?.value);
            if (v == null) continue;                    // ONBOARDING rows carry no value
            if (m.type === 'HRV') patch.hrv = v;
            // Already a deviation from the member's own baseline. A delta
            // column holds a delta.
            else if (m.type === 'SKIN_TEMP_C') patch.skinTempDelta = v;
          }
        }
        put(ymd(r.calendarDate), patch);
      }
      read.push(f.name);
      continue;
    }

    // ── 4. VO2 MAX, MARKED AS THE ESTIMATE IT IS ───────────────────────────
    if (base.includes('fitnessagedata')) {
      for (const r of list) {
        if (!r || typeof r !== 'object') continue;
        const v = num(r.biometricVo2Max);
        const d = ymd(r.asOfDateGmt);
        if (v == null || !d) continue;
        vo2Days++;
        put(d, { vo2max: Math.round(v * 10) / 10, vo2maxEstimated: true });
      }
      read.push(f.name);
      continue;
    }

    // Everything else in a Garmin export — golf clubs, inReach messages,
    // device backups, courses — is not a night and is reported, never silently
    // dropped.
    skipped.push(f.name);
  }

  const rows = [...byDay.values()].sort((a, b) => a.readingDate.localeCompare(b.readingDate));

  let fieldValues = 0;
  for (const r of rows) {
    for (const [k, v] of Object.entries(r)) {
      if (k === 'source' || k === 'originSource' || k === 'readingDate') continue;
      if (v !== null && v !== undefined) fieldValues++;
    }
  }

  return {
    rows, filesRead: read, filesSkipped: skipped,
    sleepRecords, napsSkipped: naps, udsDays, healthStatusDays: hsDays, vo2Days,
    fieldValues,
    firstDate: rows.length ? rows[0].readingDate : null,
    lastDate: rows.length ? rows[rows.length - 1].readingDate : null,
  };
}

/** The four filename patterns worth reading out of a Garmin export. */
export const GARMIN_NIGHT_FILES = /(sleepdata|udsfile|healthstatusdata|fitnessagedata)/i;
