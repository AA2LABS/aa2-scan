// ─── lib/chemical-doctrine.ts ─────────────────────────────────────────────────
// AA2 Chemical Doctrine · Prompt builder + verdict parser
// v50 · Mockup-locked against panel #2 (Scan Result with Doctrine Overlay)

import {
  AllergyProfileRow,
  AllergenHit,
  GoalConflict,
  getSensitivityMultiplier,
} from './allergy-profile';

export type Verdict = 'ALL CLEAR' | 'TAKE NOTICE' | 'PAY ATTENTION';

export interface AllergenAlert {
  allergenName: string;
  severity: 'MILD' | 'MODERATE' | 'SEVERE';
  matchedIngredient: string;
  plainLanguage: string;
}

export interface GoalConflictNote {
  goalLabel: string;
  conflictingItems: string[];
  plainLanguage: string;
}

export interface ChemicalFlag {
  chemical: string;
  category:
    | 'artificial_color'
    | 'preservative'
    | 'sweetener'
    | 'emulsifier'
    | 'flavoring'
    | 'other';
  concern: string;
}

export interface DoctrineVerdict {
  verdict: Verdict;
  allergenAlerts: AllergenAlert[];
  goalConflicts: GoalConflictNote[];
  chemicalFlags: ChemicalFlag[];
  sensitivityNote: string | null;
  cumulativeWarning: string | null;
  alternativeCTA: string | null;
}

const CHEMICAL_DOCTRINE_SYSTEM_PROMPT = `You are The Concierge, the safety intelligence layer of AA2 BioMesh.

You operate under the AA2 Chemical Doctrine. These laws are non-negotiable:

§I.1 EXPOSURE > LABEL
A "safe" ingredient becomes unsafe through repetition, timing, or combination.
Never reduce your analysis to "this contains X." Always ask: what does X do
over time, in this context, to this biology?

§I.2 CUMULATIVE LOAD MATTERS
You will receive the member's recent_exposure_classes and cumulative_load_score.
A single Red 40 product to a clean-baseline member is different from the same
product as the 4th ultra-processed item this week. Treat the load as evidence.

§I.3 BIOSIGNAL IS THE JUDGE
You are not a regulatory body. You report what the body would feel, not what
the FDA permits. If something is technically GRAS but consistently disrupts
sleep or attention in this member's profile, flag it.

§I.4 CHILDREN AND ANIMALS ARE NOT MINI ADULTS
Sensitivity multiplier scales the same chemical exposure differently across
the household. A 9-year-old at 2.0× sensitivity hits the PAY ATTENTION
threshold faster than the same product would for a 58-year-old adult.

§I.5 CHEMICALS AFFECT LEARNING, TRUST, AND BEHAVIOR
Don't reduce flags to "wellness." Behavior, focus, sleep, recovery, and
training integrity are downstream of chemistry.

VERDICT VOCABULARY (LOCKED — do not invent new verdict strings):
- ALL CLEAR      — no allergens, no goal conflicts, no concerning chemicals
- TAKE NOTICE    — minor flags, sensitivities present, watch cumulative load
- PAY ATTENTION  — allergen present OR severe goal conflict OR high cumulative load

You will return ONLY a single JSON object matching this shape:
{
  "verdict": "ALL CLEAR" | "TAKE NOTICE" | "PAY ATTENTION",
  "allergenAlerts": [{ "allergenName": string, "severity": "MILD"|"MODERATE"|"SEVERE", "matchedIngredient": string, "plainLanguage": string }],
  "goalConflicts": [{ "goalLabel": string, "conflictingItems": string[], "plainLanguage": string }],
  "chemicalFlags": [{ "chemical": string, "category": "artificial_color"|"preservative"|"sweetener"|"emulsifier"|"flavoring"|"other", "concern": string }],
  "sensitivityNote": string | null,
  "cumulativeWarning": string | null,
  "alternativeCTA": string | null
}

Plain language rules:
- Address the member by name when relevant ("Lily", "Buddy")
- Never lecture, never moralize
- Be specific ("Red 40 is linked to attention disruption in children with focus goals")
  not generic ("artificial colors are bad")
- alternativeCTA is short imperative ("Find safe alternative for Lily")
- If verdict is ALL CLEAR, all arrays are empty and all string fields are null

Return JSON only. No prose, no markdown fences, no commentary.`;

export interface ScanContext {
  productName: string;
  brand?: string | null;
  ingredients: string[];
  barcode?: string | null;
  scanType: string;
  recallCount?: number;
}

export function buildChemicalDoctrinePrompt(
  member: AllergyProfileRow,
  scan: ScanContext,
  precomputed: {
    allergenHits: AllergenHit[];
    goalConflicts: GoalConflict[];
  },
): { system: string; user: string } {
  const sensitivityX = getSensitivityMultiplier(member.role, member.age_years);

  const memberContext = JSON.stringify(
    {
      name: member.member_name,
      role: member.role,
      age_years: member.age_years,
      weight_kg: member.weight_kg,
      breed: member.breed,
      allergens: member.allergens,
      sensitivities: member.sensitivities,
      health_goals: member.health_goals,
      sensitivity_multiplier: sensitivityX,
      cumulative_load_score: member.cumulative_load_score,
      recent_exposure_classes: member.recent_exposure_classes,
    },
    null,
    2,
  );

  const scanContext = JSON.stringify(
    {
      product_name: scan.productName,
      brand: scan.brand ?? null,
      ingredients: scan.ingredients,
      barcode: scan.barcode ?? null,
      scan_type: scan.scanType,
      recall_count: scan.recallCount ?? 0,
    },
    null,
    2,
  );

  const precomputedContext = JSON.stringify(
    {
      allergen_hits: precomputed.allergenHits.map((h) => ({
        allergen: h.allergen.name,
        severity: h.allergen.severity,
        matched_ingredient: h.matchedIngredient,
      })),
      goal_conflicts: precomputed.goalConflicts.map((c) => ({
        goal: c.goal.label,
        conflicting_ingredients: c.conflictingIngredients,
      })),
    },
    null,
    2,
  );

  const user = `MEMBER:
${memberContext}

PRODUCT SCANNED:
${scanContext}

PRE-COMPUTED MATCHES (already detected by AA2 lib layer — incorporate into your verdict):
${precomputedContext}

Apply the Chemical Doctrine. Return the verdict JSON.`;

  return {
    system: CHEMICAL_DOCTRINE_SYSTEM_PROMPT,
    user,
  };
}

const VALID_VERDICTS: ReadonlyArray<Verdict> = [
  'ALL CLEAR',
  'TAKE NOTICE',
  'PAY ATTENTION',
];

const VALID_SEVERITIES: ReadonlyArray<'MILD' | 'MODERATE' | 'SEVERE'> = [
  'MILD',
  'MODERATE',
  'SEVERE',
];

const VALID_CATEGORIES: ReadonlyArray<ChemicalFlag['category']> = [
  'artificial_color',
  'preservative',
  'sweetener',
  'emulsifier',
  'flavoring',
  'other',
];

export function parseDoctrineResponse(raw: string): DoctrineVerdict {
  const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

  let parsed: any;
  try {
    parsed = JSON.parse(cleaned);
  } catch (err) {
    console.error('[chemical-doctrine] JSON parse failed:', err, raw);
    return safeFallbackVerdict();
  }

  const verdict: Verdict = VALID_VERDICTS.includes(parsed.verdict)
    ? parsed.verdict
    : 'TAKE NOTICE';

  const allergenAlerts: AllergenAlert[] = Array.isArray(parsed.allergenAlerts)
    ? parsed.allergenAlerts
        .filter((a: any) => a && typeof a.allergenName === 'string')
        .map((a: any) => ({
          allergenName: String(a.allergenName),
          severity: VALID_SEVERITIES.includes(a.severity)
            ? a.severity
            : 'MODERATE',
          matchedIngredient: String(a.matchedIngredient ?? ''),
          plainLanguage: String(a.plainLanguage ?? ''),
        }))
    : [];

  const goalConflicts: GoalConflictNote[] = Array.isArray(parsed.goalConflicts)
    ? parsed.goalConflicts
        .filter((c: any) => c && typeof c.goalLabel === 'string')
        .map((c: any) => ({
          goalLabel: String(c.goalLabel),
          conflictingItems: Array.isArray(c.conflictingItems)
            ? c.conflictingItems.map(String)
            : [],
          plainLanguage: String(c.plainLanguage ?? ''),
        }))
    : [];

  const chemicalFlags: ChemicalFlag[] = Array.isArray(parsed.chemicalFlags)
    ? parsed.chemicalFlags
        .filter((f: any) => f && typeof f.chemical === 'string')
        .map((f: any) => ({
          chemical: String(f.chemical),
          category: VALID_CATEGORIES.includes(f.category) ? f.category : 'other',
          concern: String(f.concern ?? ''),
        }))
    : [];

  return {
    verdict,
    allergenAlerts,
    goalConflicts,
    chemicalFlags,
    sensitivityNote:
      typeof parsed.sensitivityNote === 'string'
        ? parsed.sensitivityNote
        : null,
    cumulativeWarning:
      typeof parsed.cumulativeWarning === 'string'
        ? parsed.cumulativeWarning
        : null,
    alternativeCTA:
      typeof parsed.alternativeCTA === 'string' ? parsed.alternativeCTA : null,
  };
}

function safeFallbackVerdict(): DoctrineVerdict {
  return {
    verdict: 'TAKE NOTICE',
    allergenAlerts: [],
    goalConflicts: [],
    chemicalFlags: [],
    sensitivityNote: null,
    cumulativeWarning:
      'The Concierge could not parse this scan. Treat with caution and rescan if possible.',
    alternativeCTA: null,
  };
}

export function buildGenericScanContext(scan: ScanContext): {
  system: string;
  user: string;
} {
  const user = `No member profile available. Apply Chemical Doctrine to this product
in generic terms (no personalization, no sensitivity multiplier, no goal conflicts).
Flag chemicals by category and concern. Default verdict: TAKE NOTICE if any
artificial colors / preservatives / sweeteners present, else ALL CLEAR.

PRODUCT:
${JSON.stringify(scan, null, 2)}

Return verdict JSON.`;

  return {
    system: CHEMICAL_DOCTRINE_SYSTEM_PROMPT,
    user,
  };
}
