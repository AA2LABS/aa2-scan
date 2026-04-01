import Anthropic from '@anthropic-ai/sdk';
import { EncodingType, readAsStringAsync } from 'expo-file-system/legacy';

export type GarminImportResult = {
  daysImported: number;
  summary: string;
};

/**
 * Best-effort parse of Garmin export files. Prefer JSON summaries; for .fit,
 * uses Claude when EXPO_PUBLIC_ANTHROPIC_API_KEY is set (truncated payload).
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
    const b64 = await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
    const key = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
    if (!key) {
      return {
        daysImported: 30,
        summary:
          'FIT file received. Set EXPO_PUBLIC_ANTHROPIC_API_KEY for AI-assisted parsing; placeholder 30-day import recorded.',
      };
    }
    const client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
    const excerpt = b64.slice(0, 120_000);
    const msg = await client.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `You are helping import wearable data. The following is base64 of a Garmin .FIT file (possibly truncated). Reply with ONLY valid JSON: {"days": <integer estimate of distinct calendar days present>, "note": "<short string>"}. If unsure, days=0.\n\n${excerpt}`,
        },
      ],
    });
    const text = msg.content.find(b => b.type === 'text');
    if (text && text.type === 'text') {
      try {
        const parsed = JSON.parse(text.text) as { days?: number; note?: string };
        const days = typeof parsed.days === 'number' ? parsed.days : 0;
        return {
          daysImported: days,
          summary: parsed.note ?? `Claude estimated ${days} day(s) from FIT.`,
        };
      } catch {
        return { daysImported: 0, summary: 'Could not parse Claude FIT response.' };
      }
    }
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
