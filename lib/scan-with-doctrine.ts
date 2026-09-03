// ─── lib/scan-with-doctrine.ts ────────────────────────────────────────────────
// AA2 Scanner Orchestrator · The single integration point
// v50 · Wires panel #2 (Scan Result Doctrine Overlay) end-to-end
//
// Existing scan UI calls scanWithDoctrine(memberId, scan).
// Everything else lives in this file.
//
// REWIRED 2026-09-02 — Ship Blocker #1. callConcierge no longer holds a key;
// it dials the AA2 Concierge broker. The Chemical Doctrine prompt, the
// allergen pass, the exposure log and every verdict path are untouched.

import { claudeCall } from './claude';

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

const MODEL = 'claude-haiku-4-5'; // speed doctrine 2026-07-29: scan verdicts on the fast tier — one-line revert to 'claude-sonnet-4-6'
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
  try {
    const reply = await claudeCall({
      model: MODEL,
      system: prompts.system,
      user: prompts.user,
      maxTokens: MAX_TOKENS,
    });

    if (!reply.ok) {
      console.error('[scan-with-doctrine] Concierge broker error', reply.error);
      return parseDoctrineResponse('{}');
    }

    if (!reply.text) {
      console.error('[scan-with-doctrine] empty response from Concierge');
      return parseDoctrineResponse('{}');
    }

    return parseDoctrineResponse(reply.text);
  } catch (err) {
    console.error('[scan-with-doctrine] callConcierge threw:', err);
    return parseDoctrineResponse('{}');
  }
}
