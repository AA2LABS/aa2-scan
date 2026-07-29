// ─── lib/scanner-vision.ts ────────────────────────────────────────────────────
// AA2 Scanner · Vision pipeline (v50 Lock #31, mode 1)
// Camera capture base64 → Claude vision API → verdict JSON.

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5'; // speed doctrine 2026-07-29: scan verdicts on the fast tier — one-line revert to 'claude-sonnet-4-6'
const MAX_TOKENS = 2000;

export type TabContext =
  | 'scan' | 'care' | 'grownfolks' | 'fish'
  | 'species' | 'apothecary' | 'forager';

export interface VisionScanInput {
  imageBase64: string;
  tabContext: TabContext;
  personalTruth: string;
  systemPrompt: string;
  onPartial?: (accumulatedText: string) => void;
}

export interface VisionScanResult {
  ok: boolean;
  rawText: string;
  errorMessage?: string;
}

export async function scanWithVision(input: VisionScanInput): Promise<VisionScanResult> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { ok: false, rawText: '', errorMessage: 'API key missing' };
  }

  const userContent = [
    {
      type: 'image' as const,
      source: {
        type: 'base64' as const,
        media_type: 'image/jpeg' as const,
        data: input.imageBase64,
      },
    },
    {
      type: 'text' as const,
      text: buildVisionPrompt(input.tabContext, input.personalTruth),
    },
  ];

  try {
    if (input.onPartial) {
      const { streamClaude } = await import('./claude-stream');
      const streamed = await streamClaude({
        system: input.systemPrompt,
        content: userContent,
        max_tokens: MAX_TOKENS,
        onPartial: input.onPartial,
      });
      if (!streamed) {
        return { ok: false, rawText: '', errorMessage: 'Empty response' };
      }
      return { ok: true, rawText: streamed };
    }

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: input.systemPrompt,
        messages: [{ role: 'user', content: userContent }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[scanner-vision] API error', response.status, errText);
      return { ok: false, rawText: '', errorMessage: 'API ' + response.status };
    }

    const json = await response.json();
    const textContent = (json.content ?? [])
      .filter((b: any) => b?.type === 'text')
      .map((b: any) => String(b.text ?? ''))
      .join('\n')
      .trim();

    if (!textContent) {
      return { ok: false, rawText: '', errorMessage: 'Empty response' };
    }

    return { ok: true, rawText: textContent };
  } catch (err: any) {
    console.error('[scanner-vision] threw:', err);
    return { ok: false, rawText: '', errorMessage: err?.message || 'Unknown error' };
  }
}

function buildVisionPrompt(tab: TabContext, personalTruth: string): string {
  const ctx = personalTruth ? '\n\n' + personalTruth + '\n\n' : '\n';
  switch (tab) {
    case 'scan':
      return 'You are looking at a product photo the member just captured.' + ctx + 'Identify the product from the image. Read visible label, ingredients, branding. Apply AA2 Chemical Doctrine. Return verdict JSON with productName, verdict, verdictReason, allergyAlert, recallAlert, equalizerVoice. If image unreadable, set verdict TAKE NOTICE and verdictReason "Image unclear — try again or speak the product name."';
    case 'care':
      return 'You are looking at a personal care product photo.' + ctx + 'Identify the product. Read visible INCI ingredients. Apply SKIN INGESTION DOCTRINE. Return verdict JSON.';
    case 'grownfolks':
      return 'You are looking at an alcoholic beverage photo.' + ctx + 'Identify bottle, type, region. Provide pairing + health intel. Return verdict JSON with beverageType, productName, verdict, verdictReason, equalizerVoice.';
    case 'fish':
      return 'You are looking at a fish or seafood photo.' + ctx + 'If packaged, read label and apply Chemical Doctrine. If live or cooked, identify species. Return verdict JSON with speciesName, scientificName, productName, safetyTag, verdict, verdictReason.';
    case 'species':
      return 'You are looking at a food product photo.' + ctx + 'Identify from image. Read visible label. Apply AA2 Chemical Doctrine. Return verdict JSON.';
    case 'apothecary':
      return 'You are looking at a plant or herb photo.' + ctx + 'Identify species from visible features. Apply Apothecary doctrine — safety, confidence, edibility, prep. Return verdict JSON. Never claim certainty above 90% on visual ID alone.';
    case 'forager':
      return 'You are looking at a wild plant, mushroom, or berry photo.' + ctx + 'Identify species from features. Apply Forager doctrine — NEVER claim 100% confidence on wild items, especially mushrooms. Return verdict JSON with speciesName, scientificName, edibility, season, region, confidenceNote, and clear safety warning if toxic look-alikes exist.';
    default:
      return 'You are looking at a product photo.' + ctx + 'Identify the product. Apply AA2 Chemical Doctrine. Return verdict JSON.';
  }
}

export function isVisionEmpty(rawText: string): boolean {
  if (!rawText || rawText.trim().length < 20) return true;
  const upper = rawText.toUpperCase();
  if (upper.includes('IMAGE UNCLEAR')) return true;
  if (upper.includes('CANNOT IDENTIFY')) return true;
  if (upper.includes('UNABLE TO READ')) return true;
  if (!rawText.includes('{') || !rawText.includes('}')) return true;
  return false;
}
