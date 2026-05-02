// ─── lib/scan-with-doctrine.ts ────────────────────────────────────────────────
// AA2 Scanner Orchestrator · The single integration point
// v50 · Wires panel #2 (Scan Result Doctrine Overlay) end-to-end
//
// Existing scan UI calls scanWithDoctrine(memberId, scan).
// Everything else lives in this file.

import {
  detectAllergenHits,
  detectGoalConflicts,
  getAllergyProfile,
} from './allergy-profile';

import {
  buildChemicalDoctrinePrompt,
  buildGenericScanContext,
  parseDoctrineResponse,
  DoctrineVerdict,
  ScanContext,
} from './chemical-doctrine';

import {
  classifyIngredients,
  logExposureEvent,
  ExposureCategory,
} from './exposure-tracker';

export interface ScanWithDoctrineResult {
  memberId: string | null;
  memberName: string | null;
  productName: string;
  verdict: DoctrineVerdict;
  exposureCategories: ExposureCategory[];
  cumulativeLoadScore: number;
  scanLoggedId: string | null;
  isGenericScan: boolean;
  timestamp: string;
}

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 1500;

export async function scanWithDoctrine(
  memberId: string | null,
  scan: ScanContext,
): Promise<ScanWithDoctrineResult> {
  const timestamp = new Date().toISOString();

  if (!memberId) {
    const verdict = await callConcierge(buildGenericScanContext(scan));
    return {
      memberId: null,
      memberName: null,
      productName: scan.productName,
      verdict,
      exposureCategories: classifyIngredients(scan.ingredients),
      cumulativeLoadScore: 0,
      scanLoggedId: null,
      isGenericScan: true,
      timestamp,
    };
  }

  const member = await getAllergyProfile(memberId);
  if (!member) {
    console.warn(
      '[scan-with-doctrine] memberId not found, falling back to generic',
      memberId,
    );
    const verdict = await callConcierge(buildGenericScanContext(scan));
    return {
      memberId: null,
      memberName: null,
      productName: scan.productName,
      verdict,
      exposureCategories: classifyIngredients(scan.ingredients),
      cumulativeLoadScore: 0,
      scanLoggedId: null,
      isGenericScan: true,
      timestamp,
    };
  }

  const allergenHits = detectAllergenHits(member.allergens, scan.ingredients);
  const goalConflicts = detectGoalConflicts(
    member.health_goals,
    scan.ingredients,
  );
  const exposureCategories = classifyIngredients(scan.ingredients);

  const promptPair = buildChemicalDoctrinePrompt(member, scan, {
    allergenHits,
    goalConflicts,
  });

  const verdict = await callConcierge(promptPair);

  let scanLoggedId: string | null = null;
  try {
    const result = await logExposureEvent({
      member_id: member.member_id,
      product_name: scan.productName,
      ingredients: scan.ingredients,
      categories: exposureCategories,
      verdict: verdict.verdict,
      scan_type: scan.scanType,
      barcode: scan.barcode ?? null,
    });
    scanLoggedId = result?.id ?? null;
  } catch (err) {
    console.error('[scan-with-doctrine] logExposureEvent threw:', err);
  }

  return {
    memberId: member.member_id,
    memberName: member.member_name,
    productName: scan.productName,
    verdict,
    exposureCategories,
    cumulativeLoadScore: member.cumulative_load_score,
    scanLoggedId,
    isGenericScan: false,
    timestamp,
  };
}

async function callConcierge(prompts: {
  system: string;
  user: string;
}): Promise<DoctrineVerdict> {
  const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[scan-with-doctrine] EXPO_PUBLIC_ANTHROPIC_API_KEY missing');
    return parseDoctrineResponse('{}');
  }

  try {
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
        system: prompts.system,
        messages: [{ role: 'user', content: prompts.user }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(
        '[scan-with-doctrine] Anthropic API error',
        response.status,
        errText,
      );
      return parseDoctrineResponse('{}');
    }

    const json = await response.json();

    const textContent = (json.content ?? [])
      .filter((b: any) => b?.type === 'text')
      .map((b: any) => String(b.text ?? ''))
      .join('\n')
      .trim();

    if (!textContent) {
      console.error('[scan-with-doctrine] empty response from Concierge');
      return parseDoctrineResponse('{}');
    }

    return parseDoctrineResponse(textContent);
  } catch (err) {
    console.error('[scan-with-doctrine] callConcierge threw:', err);
    return parseDoctrineResponse('{}');
  }
}
