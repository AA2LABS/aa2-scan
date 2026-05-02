// ─── lib/allergy-profile.ts ───────────────────────────────────────────────────
// AA2 Allergy Intelligence Layer · Profile management
// Schema source of truth: Supabase Migration 1 (allergy_profiles table)
// v50 · Mockup-locked against panel #1 (Household Profile Selector) and
//        panel #2 (Scan Result with Doctrine Overlay)

import { supabase } from './supabase';

export type MemberRole =
  | 'adult'
  | 'child'
  | 'infant'
  | 'canine'
  | 'feline'
  | 'equine';

export type AllergenSeverity = 'MILD' | 'MODERATE' | 'SEVERE';

export interface Allergen {
  name: string;
  severity: AllergenSeverity;
  notes?: string;
}

export interface Sensitivity {
  name: string;
  reaction?: string;
}

export interface HealthGoal {
  id: GoalId;
  label: string;
  conflictKeywords: string[];
}

export type GoalId =
  | 'focus_cognition'
  | 'sleep_recovery'
  | 'longevity'
  | 'weight_management'
  | 'focus_endurance'
  | 'training_integrity'
  | 'canine_longevity'
  | 'age_appropriate';

export interface AllergyProfileRow {
  id: string;
  user_id: string;
  member_id: string;
  member_name: string;
  role: MemberRole;
  age_years: number | null;
  weight_kg: number | null;
  breed: string | null;
  allergens: Allergen[];
  sensitivities: Sensitivity[];
  health_goals: GoalId[];
  recent_exposure_classes: string[];
  cumulative_load_score: number;
  last_updated: string;
  created_at: string;
}

export const GOAL_LIBRARY: Record<GoalId, HealthGoal> = {
  focus_cognition: {
    id: 'focus_cognition',
    label: 'Focus & Cognition',
    conflictKeywords: [
      'red 40', 'red dye', 'yellow 5', 'yellow 6', 'blue 1', 'blue 2',
      'aspartame', 'high fructose corn syrup', 'hfcs',
      'msg', 'monosodium glutamate',
    ],
  },
  sleep_recovery: {
    id: 'sleep_recovery',
    label: 'Sleep & Recovery',
    conflictKeywords: [
      'caffeine', 'taurine', 'guarana', 'yerba mate',
      'theobromine', 'green tea extract',
    ],
  },
  longevity: {
    id: 'longevity',
    label: 'Longevity',
    conflictKeywords: [
      'partially hydrogenated', 'trans fat',
      'sodium nitrite', 'sodium nitrate', 'bha', 'bht',
      'potassium bromate', 'tbhq',
    ],
  },
  weight_management: {
    id: 'weight_management',
    label: 'Weight Management',
    conflictKeywords: [
      'high fructose corn syrup', 'hfcs', 'corn syrup',
      'maltodextrin', 'dextrose', 'sucrose',
    ],
  },
  focus_endurance: {
    id: 'focus_endurance',
    label: 'Focus & Endurance',
    conflictKeywords: [
      'red 40', 'yellow 5', 'aspartame',
      'sucralose', 'acesulfame potassium',
    ],
  },
  training_integrity: {
    id: 'training_integrity',
    label: 'Training Integrity',
    conflictKeywords: [
      'bha', 'bht', 'ethoxyquin', 'propylene glycol',
      'corn syrup', 'meat by-products',
    ],
  },
  canine_longevity: {
    id: 'canine_longevity',
    label: 'Canine Longevity',
    conflictKeywords: [
      'bha', 'bht', 'ethoxyquin',
      'meat by-products', 'corn syrup', 'sodium nitrite',
    ],
  },
  age_appropriate: {
    id: 'age_appropriate',
    label: 'Age-Appropriate Nutrition',
    conflictKeywords: [
      'caffeine', 'aspartame', 'sucralose',
      'red 40', 'yellow 5', 'high fructose corn syrup',
    ],
  },
};

export function getSensitivityMultiplier(
  role: MemberRole,
  ageYears: number | null,
): number {
  switch (role) {
    case 'infant':
      return 3.0;
    case 'child':
      if (ageYears !== null && ageYears < 6) return 2.5;
      return 2.0;
    case 'feline':
      return 2.2;
    case 'canine':
      return 1.8;
    case 'equine':
      return 1.5;
    case 'adult':
    default:
      return 1.0;
  }
}

export interface AllergenHit {
  allergen: Allergen;
  matchedIngredient: string;
}

const ALLERGEN_KEYWORD_MAP: Record<string, string[]> = {
  'tree nuts': [
    'almond', 'walnut', 'pecan', 'cashew', 'pistachio',
    'hazelnut', 'macadamia', 'brazil nut', 'pine nut',
  ],
  'peanuts': ['peanut', 'arachis', 'groundnut'],
  'shellfish': [
    'shrimp', 'crab', 'lobster', 'prawn', 'crayfish',
    'crawfish', 'krill',
  ],
  'shellfish (mollusc)': [
    'oyster', 'clam', 'mussel', 'scallop', 'octopus', 'squid', 'calamari',
  ],
  'dairy': [
    'milk', 'cream', 'butter', 'cheese', 'whey', 'casein',
    'lactose', 'ghee', 'buttermilk',
  ],
  'eggs': ['egg', 'albumin', 'lysozyme', 'globulin', 'mayonnaise'],
  'gluten': ['wheat', 'barley', 'rye', 'malt', 'spelt', 'semolina', 'farina'],
  'soy': ['soy', 'soya', 'edamame', 'tofu', 'tempeh', 'miso'],
  'fish': [
    'salmon', 'tuna', 'cod', 'tilapia', 'anchovy', 'sardine',
    'halibut', 'mackerel',
  ],
  'sesame': ['sesame', 'tahini'],
  'corn': ['corn', 'maize', 'corn syrup', 'cornstarch', 'cornmeal'],
};

export function detectAllergenHits(
  profileAllergens: Allergen[],
  ingredients: string[],
): AllergenHit[] {
  const hits: AllergenHit[] = [];
  const ingredientsLower = ingredients.map((i) => i.toLowerCase());

  for (const allergen of profileAllergens) {
    const allergenKey = allergen.name.toLowerCase();
    const keywords = ALLERGEN_KEYWORD_MAP[allergenKey] || [allergenKey];

    for (const ingredient of ingredientsLower) {
      for (const keyword of keywords) {
        if (ingredient.includes(keyword)) {
          hits.push({ allergen, matchedIngredient: ingredient });
          break;
        }
      }
    }
  }

  const severityOrder: Record<AllergenSeverity, number> = {
    SEVERE: 0,
    MODERATE: 1,
    MILD: 2,
  };
  return hits.sort(
    (a, b) =>
      severityOrder[a.allergen.severity] - severityOrder[b.allergen.severity],
  );
}

export interface GoalConflict {
  goal: HealthGoal;
  conflictingIngredients: string[];
}

export function detectGoalConflicts(
  activeGoalIds: GoalId[],
  ingredients: string[],
): GoalConflict[] {
  const conflicts: GoalConflict[] = [];
  const ingredientsLower = ingredients.map((i) => i.toLowerCase());

  for (const goalId of activeGoalIds) {
    const goal = GOAL_LIBRARY[goalId];
    if (!goal) continue;

    const matched: string[] = [];
    for (const keyword of goal.conflictKeywords) {
      for (const ingredient of ingredientsLower) {
        if (ingredient.includes(keyword)) {
          matched.push(ingredient);
        }
      }
    }

    if (matched.length > 0) {
      conflicts.push({
        goal,
        conflictingIngredients: Array.from(new Set(matched)),
      });
    }
  }

  return conflicts;
}

export async function getAllergyProfile(
  memberId: string,
): Promise<AllergyProfileRow | null> {
  const { data, error } = await supabase
    .from('allergy_profiles')
    .select('*')
    .eq('member_id', memberId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error('[allergy-profile] getAllergyProfile error:', error);
    return null;
  }
  return data as AllergyProfileRow;
}

export async function getHouseholdProfiles(): Promise<AllergyProfileRow[]> {
  const { data, error } = await supabase
    .from('allergy_profiles')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[allergy-profile] getHouseholdProfiles error:', error);
    return [];
  }
  return (data ?? []) as AllergyProfileRow[];
}

export interface UpsertAllergyProfileInput {
  member_id: string;
  member_name: string;
  role: MemberRole;
  age_years?: number | null;
  weight_kg?: number | null;
  breed?: string | null;
  allergens?: Allergen[];
  sensitivities?: Sensitivity[];
  health_goals?: GoalId[];
}

export async function upsertAllergyProfile(
  input: UpsertAllergyProfileInput,
): Promise<AllergyProfileRow | null> {
  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    console.error('[allergy-profile] no auth user for upsert', authError);
    return null;
  }

  const payload = {
    user_id: authData.user.id,
    member_id: input.member_id,
    member_name: input.member_name,
    role: input.role,
    age_years: input.age_years ?? null,
    weight_kg: input.weight_kg ?? null,
    breed: input.breed ?? null,
    allergens: input.allergens ?? [],
    sensitivities: input.sensitivities ?? [],
    health_goals: input.health_goals ?? [],
    last_updated: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('allergy_profiles')
    .upsert(payload, { onConflict: 'member_id' })
    .select()
    .single();

  if (error) {
    console.error('[allergy-profile] upsertAllergyProfile error:', error);
    return null;
  }
  return data as AllergyProfileRow;
}
