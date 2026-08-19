// ─── lib/diet.ts ─────────────────────────────────────────────────────────────
// DIETARY APPROACH — one source of truth.
//
// Founder ruling 2026-08-19: "The screen that's missing is the screen that
// matters — the onboarding. If I can't pick the diet before I hit save, then
// wherever it is second is irrelevant."
//
// Before this file there were two hardcoded lists that disagreed: onboarding
// offered ten options and only let a member pick ONE; Bio Buddy offered five
// (including Mediterranean, which onboarding did not have) and let them pick
// several. A member declared themselves at the door and then met a different
// menu inside. The Chef reads this field on every food scan, so the drift was
// landing in the recipes.
//
// MULTI-SELECT IS LAW HERE. Halal and Mediterranean are not mutually
// exclusive. Neither are Kosher and Vegetarian, or Gluten-Free and Paleo.
// A single-select diet field forces a member to hide half of how they eat,
// and the Chef only ever hears half a person.
//
// Storage: onboarding's `dietary_approach` field maps to
// health_profiles.diet_types (kind: 'array') in lib/db.ts — the database was
// already an array. Only the screen was treating it as one answer.
// ─────────────────────────────────────────────────────────────────────────────

export const DIET_OPTIONS: string[] = [
  'Omnivore',
  'Mediterranean',
  'Vegetarian',
  'Pescatarian',
  'Vegan',
  'Keto',
  'Carnivore',
  'Paleo',
  'Halal',
  'Kosher',
  'Gluten-Free',
  'Dairy-Free',
  'No Restriction',
  'Other',
];

/** Options that mean "nothing to filter" — selecting one clears the rest. */
export const DIET_EXCLUSIVE: string[] = ['No Restriction'];

/**
 * Toggle a diet on or off within a member's selection.
 * Choosing "No Restriction" clears everything else; choosing anything else
 * clears "No Restriction". Never silently drops a member's other answers.
 */
export function toggleDietValue(current: string[], val: string): string[] {
  const has = current.includes(val);
  if (has) return current.filter(v => v !== val);
  if (DIET_EXCLUSIVE.includes(val)) return [val];
  return [...current.filter(v => !DIET_EXCLUSIVE.includes(v)), val];
}

/** Human-readable line for profile summaries and Chef context. */
export function dietLine(diets: string[] | undefined | null): string {
  return diets && diets.length ? diets.join(' · ') : 'Not set';
}
