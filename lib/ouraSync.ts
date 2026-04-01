/**
 * Oura Cloud API v2 — validate token and pull ~30d into biosignal-shaped rows.
 * https://cloud.ouraring.com/v2/docs
 */

const OURA = 'https://api.ouraring.com/v2/usercollection';

export type OuraDailyRow = {
  reading_date: string;
  hrv_rmssd: number | null;
  sleep_score: number | null;
  readiness_score: number | null;
  activity_score: number | null;
  stress_level: number | null;
};

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

async function fetchOura<T>(
  path: string,
  token: string,
  query: Record<string, string>
): Promise<T> {
  const q = new URLSearchParams(query).toString();
  const url = `${OURA}/${path}?${q}`;
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${token.trim()}`, Accept: 'application/json' },
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`Oura ${path} ${r.status}: ${t.slice(0, 200)}`);
  }
  return r.json() as Promise<T>;
}

/** GET personal_info — works with a valid PAT (no extra scopes). */
export async function validateOuraToken(token: string): Promise<boolean> {
  try {
    const r = await fetch(`${OURA}/personal_info`, {
      headers: { Authorization: `Bearer ${token.trim()}`, Accept: 'application/json' },
    });
    return r.ok;
  } catch {
    return false;
  }
}

type ListResp<T> = { data?: T[] };

function mergeDay(
  map: Map<string, OuraDailyRow>,
  day: string,
  patch: Partial<Omit<OuraDailyRow, 'reading_date'>>
) {
  if (!day) return;
  const cur = map.get(day) ?? {
    reading_date: day,
    hrv_rmssd: null,
    sleep_score: null,
    readiness_score: null,
    activity_score: null,
    stress_level: null,
  };
  map.set(day, { ...cur, ...patch });
}

export async function fetchOuraLast30Days(token: string): Promise<OuraDailyRow[]> {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 30);
  const sd = ymd(start);
  const ed = ymd(end);
  const q = { start_date: sd, end_date: ed };
  const t = token.trim();

  const [readiness, dailySleep, activity, sleepSessions, stress] = await Promise.all([
    fetchOura<ListResp<{ day: string; score?: number }>>('daily_readiness', t, q),
    fetchOura<ListResp<{ day: string; score?: number }>>('daily_sleep', t, q),
    fetchOura<ListResp<{ day: string; score?: number }>>('daily_activity', t, q),
    fetchOura<ListResp<{ day: string; average_hrv?: number }>>('sleep', t, q).catch(
      () => ({ data: [] } as ListResp<{ day: string; average_hrv?: number }>)
    ),
    fetchOura<ListResp<{ day: string; stress_high?: number }>>('daily_stress', t, q).catch(
      () => ({ data: [] } as ListResp<{ day: string; stress_high?: number }>)
    ),
  ]);

  const map = new Map<string, OuraDailyRow>();

  for (const d of readiness.data ?? []) {
    mergeDay(map, d.day, { readiness_score: d.score ?? null });
  }
  for (const d of dailySleep.data ?? []) {
    mergeDay(map, d.day, { sleep_score: d.score ?? null });
  }
  for (const d of activity.data ?? []) {
    mergeDay(map, d.day, { activity_score: d.score ?? null });
  }
  for (const d of sleepSessions.data ?? []) {
    mergeDay(map, d.day, { hrv_rmssd: d.average_hrv ?? null });
  }
  for (const d of stress.data ?? []) {
    mergeDay(map, d.day, { stress_level: d.stress_high ?? null });
  }

  return [...map.values()].sort((a, b) => a.reading_date.localeCompare(b.reading_date));
}

export function computeOuraBaselines(rows: OuraDailyRow[]): {
  hrv_baseline_30d: number | null;
  readiness_baseline_30d: number | null;
} {
  const hrvs = rows.map(r => r.hrv_rmssd).filter((x): x is number => x != null && !Number.isNaN(x));
  const rdy = rows
    .map(r => r.readiness_score)
    .filter((x): x is number => x != null && !Number.isNaN(x));
  const hrv_baseline_30d = hrvs.length
    ? Math.round((hrvs.reduce((a, b) => a + b, 0) / hrvs.length) * 1000) / 1000
    : null;
  const readiness_baseline_30d = rdy.length
    ? Math.round((rdy.reduce((a, b) => a + b, 0) / rdy.length) * 1000) / 1000
    : null;
  return { hrv_baseline_30d, readiness_baseline_30d };
}
