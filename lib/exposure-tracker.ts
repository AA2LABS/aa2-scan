// ─── lib/exposure-tracker.ts ──────────────────────────────────────────────────
// AA2 Exposure Tracker · Ingredient classification + event logging
// v50 · Backed by Supabase exposure_events table + trg_update_load_score trigger
//
// Architectural lock:
//   The Postgres trigger (Migration 1) is the SOURCE OF TRUTH for
//   cumulative_load_score. This lib does NOT write to that column directly.

import { supabase } from './supabase';
import { Verdict } from './chemical-doctrine';

export type ExposureCategory =
  | 'artificial_color'
  | 'preservative'
  | 'artificial_sweetener'
  | 'high_fructose_corn_syrup'
  | 'trans_fat'
  | 'ultra_processed'
  | 'caffeine'
  | 'alcohol'
  | 'pesticide_residue'
  | 'tree_nuts'
  | 'shellfish'
  | 'dairy'
  | 'gluten'
  | 'soy'
  | 'eggs'
  | 'fish'
  | 'sesame'
  | 'corn';

interface CategoryRule {
  category: ExposureCategory;
  patterns: RegExp[];
}

const CLASSIFIER_RULES: CategoryRule[] = [
  {
    category: 'artificial_color',
    patterns: [
      /\b(?:red|yellow|blue|green)\s*(?:no\.?\s*)?\d+\b/i,
      /\b(?:fd&c|fdc)\s+(?:red|yellow|blue|green)/i,
      /\btartrazine\b/i,
      /\bcarmoisine\b/i,
      /\bsunset\s+yellow\b/i,
    ],
  },
  {
    category: 'preservative',
    patterns: [
      /\bbht\b/i,
      /\bbha\b/i,
      /\btbhq\b/i,
      /\bsodium\s+(?:nitrite|nitrate|benzoate)\b/i,
      /\bpotassium\s+(?:sorbate|bromate)\b/i,
      /\bcalcium\s+propionate\b/i,
      /\bethoxyquin\b/i,
      /\bsulfite/i,
    ],
  },
  {
    category: 'artificial_sweetener',
    patterns: [
      /\baspartame\b/i,
      /\bsucralose\b/i,
      /\bacesulfame\s+(?:k|potassium)\b/i,
      /\bsaccharin\b/i,
      /\bneotame\b/i,
    ],
  },
  {
    category: 'high_fructose_corn_syrup',
    patterns: [/\bhigh\s+fructose\s+corn\s+syrup\b/i, /\bhfcs\b/i],
  },
  {
    category: 'trans_fat',
    patterns: [
      /\bpartially\s+hydrogenated\b/i,
      /\btrans\s+fat\b/i,
      /\bhydrogenated\s+oil\b/i,
    ],
  },
  {
    category: 'caffeine',
    patterns: [
      /\bcaffeine\b/i,
      /\bguarana\b/i,
      /\byerba\s+mate\b/i,
      /\btheobromine\b/i,
    ],
  },
  {
    category: 'tree_nuts',
    patterns: [
      /\b(?:almond|walnut|pecan|cashew|pistachio|hazelnut|macadamia)\b/i,
      /\bbrazil\s+nut\b/i,
      /\bpine\s+nut\b/i,
    ],
  },
  {
    category: 'shellfish',
    patterns: [
      /\b(?:shrimp|crab|lobster|prawn|crawfish|crayfish|krill)\b/i,
      /\b(?:oyster|clam|mussel|scallop|octopus|squid|calamari)\b/i,
    ],
  },
  {
    category: 'dairy',
    patterns: [
      /\b(?:milk|cream|butter|cheese|whey|casein|lactose|ghee|buttermilk)\b/i,
    ],
  },
  {
    category: 'gluten',
    patterns: [/\b(?:wheat|barley|rye|malt|spelt|semolina|farina)\b/i],
  },
];

export function classifyIngredients(ingredients: string[]): ExposureCategory[] {
  const found = new Set<ExposureCategory>();
  const joined = ingredients.join(' ');

  for (const rule of CLASSIFIER_RULES) {
    for (const pattern of rule.patterns) {
      if (pattern.test(joined)) {
        found.add(rule.category);
        break;
      }
    }
  }

  if (
    found.size >= 3 &&
    (found.has('preservative') ||
      found.has('artificial_color') ||
      found.has('artificial_sweetener'))
  ) {
    found.add('ultra_processed');
  }

  return Array.from(found);
}

export interface LogExposureEventInput {
  member_id: string;
  product_name: string;
  ingredients: string[];
  categories: ExposureCategory[];
  verdict: Verdict;
  scan_type: string;
  barcode?: string | null;
}

export async function logExposureEvent(
  input: LogExposureEventInput,
): Promise<{ id: string } | null> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    console.error('[exposure-tracker] no auth user', authError);
    return null;
  }

  const { data, error } = await supabase
    .from('exposure_events')
    .insert({
      user_id: authData.user.id,
      member_id: input.member_id,
      product_name: input.product_name,
      ingredient_list: input.ingredients,
      categories: input.categories,
      verdict: input.verdict,
      scan_type: input.scan_type,
      barcode: input.barcode ?? null,
      scanned_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error) {
    console.error('[exposure-tracker] logExposureEvent error:', error);
    return null;
  }
  return data as { id: string };
}

export interface ExposureEventLite {
  scanned_at: string;
  verdict: Verdict;
}

export function computeCumulativeLoad(events: ExposureEventLite[]): number {
  const now = Date.now();
  const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;

  const score = events
    .filter((e) => {
      const eventTime = new Date(e.scanned_at).getTime();
      return now - eventTime <= thirtyDaysMs;
    })
    .reduce((sum, e) => {
      switch (e.verdict) {
        case 'PAY ATTENTION':
          return sum + 10;
        case 'TAKE NOTICE':
          return sum + 5;
        case 'ALL CLEAR':
        default:
          return sum + 1;
      }
    }, 0);

  return Math.min(100, score);
}

export async function getRecentExposureClasses(
  memberId: string,
  limit: number = 20,
): Promise<ExposureCategory[]> {
  const { data, error } = await supabase
    .from('exposure_events')
    .select('categories, scanned_at')
    .eq('member_id', memberId)
    .order('scanned_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[exposure-tracker] getRecentExposureClasses error:', error);
    return [];
  }

  const all = new Set<ExposureCategory>();
  for (const row of data ?? []) {
    const cats = (row.categories as ExposureCategory[]) ?? [];
    for (const c of cats) all.add(c);
  }
  return Array.from(all);
}
