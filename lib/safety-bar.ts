// ─── lib/safety-bar.ts ────────────────────────────────────────────────────────
// AA2 Safety Bar · Multi-source advisory synthesizer
// v50 · Mockup-locked against panels #8 and #9

export type SafetyStatus =
  | 'ALL_CLEAR'
  | 'STABLE'
  | 'TAKE_NOTICE'
  | 'PAY_ATTENTION';

export type AdvisorySource =
  | 'US_STATE_DEPT'
  | 'UK_FCDO'
  | 'OSAC'
  | 'GOV_CA'
  | 'WHO';

export type UsLevel = 1 | 2 | 3 | 4;

export type UkLevel =
  | 'see_our_advice'
  | 'all_but_essential'
  | 'all_travel'
  | 'no_warning';

export interface AdvisoryReading {
  source: AdvisorySource;
  rawLevel: string;
  status: SafetyStatus;
  updated: string;
  note?: string;
}

export interface SafetyBarOutput {
  status: SafetyStatus;
  pillLabel: string;
  plainLine: string;
  provenanceLine: string;
  sources: AdvisorySource[];
  expandedBriefAvailable: boolean;
}

const STATUS_TO_PILL: Record<SafetyStatus, string> = {
  ALL_CLEAR: 'ALL CLEAR',
  STABLE: 'STABLE',
  TAKE_NOTICE: 'TAKE NOTICE',
  PAY_ATTENTION: 'PAY ATTENTION',
};

const STATUS_RANK: Record<SafetyStatus, number> = {
  ALL_CLEAR: 0,
  STABLE: 1,
  TAKE_NOTICE: 2,
  PAY_ATTENTION: 3,
};

export function mapUsLevelToStatus(level: UsLevel): SafetyStatus {
  switch (level) {
    case 1:
      return 'ALL_CLEAR';
    case 2:
      return 'TAKE_NOTICE';
    case 3:
    case 4:
      return 'PAY_ATTENTION';
    default:
      return 'STABLE';
  }
}

export function mapUkLevelToStatus(level: UkLevel): SafetyStatus {
  switch (level) {
    case 'no_warning':
      return 'ALL_CLEAR';
    case 'see_our_advice':
      return 'TAKE_NOTICE';
    case 'all_but_essential':
    case 'all_travel':
      return 'PAY_ATTENTION';
    default:
      return 'STABLE';
  }
}

const STATUS_LABEL_FOR_LINE: Record<SafetyStatus, string> = {
  ALL_CLEAR: 'Tourist zones secure',
  STABLE: 'Normal precautions apply',
  TAKE_NOTICE: 'Tourist zones secure',
  PAY_ATTENTION: 'High risk advisory in effect',
};

export function highestRiskAcross(
  readings: AdvisoryReading[],
): SafetyStatus {
  if (readings.length === 0) return 'STABLE';
  let max: SafetyStatus = 'ALL_CLEAR';
  let maxRank = STATUS_RANK[max];
  for (const r of readings) {
    const rank = STATUS_RANK[r.status];
    if (rank > maxRank) {
      max = r.status;
      maxRank = rank;
    }
  }
  return max;
}

function formatSourcesLine(
  readings: AdvisoryReading[],
  asOfDate: string,
): string {
  const sourceLabels: Record<AdvisorySource, string> = {
    US_STATE_DEPT: 'US STATE DEPT',
    UK_FCDO: 'UK FCDO',
    OSAC: 'OSAC',
    GOV_CA: 'GOV CANADA',
    WHO: 'WHO',
  };
  const labels = readings.map((r) => sourceLabels[r.source]);
  const usReading = readings.find((r) => r.source === 'US_STATE_DEPT');
  const usFragment = usReading
    ? `US LEVEL ${usReading.rawLevel} · `
    : '';
  return `${usFragment}${labels.length} SOURCES · UPDATED ${asOfDate.toUpperCase()}`;
}

function formatPlainLine(
  destinationCity: string,
  status: SafetyStatus,
): string {
  return `${destinationCity} · ${STATUS_LABEL_FOR_LINE[status]}`;
}

export interface BuildSafetyBarInput {
  destinationCity: string;
  readings: AdvisoryReading[];
  asOfDate: string;
}

export function buildSafetyBar(input: BuildSafetyBarInput): SafetyBarOutput {
  const status = highestRiskAcross(input.readings);
  return {
    status,
    pillLabel: STATUS_TO_PILL[status],
    plainLine: formatPlainLine(input.destinationCity, status),
    provenanceLine: formatSourcesLine(input.readings, input.asOfDate),
    sources: input.readings.map((r) => r.source),
    expandedBriefAvailable: input.readings.length > 0,
  };
}

export const STUB_READINGS_MEXICO_CITY: AdvisoryReading[] = [
  {
    source: 'US_STATE_DEPT',
    rawLevel: '2',
    status: 'TAKE_NOTICE',
    updated: '2026-04-15',
    note: 'Exercise increased caution due to crime',
  },
  {
    source: 'UK_FCDO',
    rawLevel: 'see_our_advice',
    status: 'TAKE_NOTICE',
    updated: '2026-04-22',
  },
  {
    source: 'OSAC',
    rawLevel: 'medium',
    status: 'TAKE_NOTICE',
    updated: '2026-04-30',
  },
];

export const STUB_READINGS_BOZEMAN: AdvisoryReading[] = [
  {
    source: 'US_STATE_DEPT',
    rawLevel: '1',
    status: 'ALL_CLEAR',
    updated: '2026-05-01',
  },
];
