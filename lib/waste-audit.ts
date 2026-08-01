// ─── lib/waste-audit.ts ──────────────────────────────────────────────────────
// THE WASTE-TO-DREAMS WIRE · VERSION ONE (doctrine locked 2026-08-01).
// Canon v17 receipts: the Equalizer owns "spending load awareness, subscription
// waste identification"; the Chauffeur owns "savings rerouting, transfer
// sequencing." No bank permissions in Version One — the member declares what
// they pay monthly, the Equalizer names the overlap (AA2 already does this,
// and more, and personally), and the reroute writes REAL vault_ledger rows so
// AWARE DOLLARS grows on the Control Panel. The redirect earns the discount.
// ─────────────────────────────────────────────────────────────────────────────

export interface WasteItem {
  key: string;
  name: string;          // the category the member recognizes
  monthly: number;       // honest typical monthly price, USD
  replacedBy: string;    // the membrane organ that already does it — and more
}

export const WASTE_CATALOG: WasteItem[] = [
  { key: 'meal_planning', name: 'Meal planning app',      monthly: 9.99,
    replacedBy: 'The Chef — recipes from YOUR pantry, YOUR allergies, YOUR trajectory' },
  { key: 'sleep_app',     name: 'Sleep / recovery app',   monthly: 9.99,
    replacedBy: 'Bio Buddy — your real devices, your real baseline, one nervous system' },
  { key: 'label_scanner', name: 'Food label scanner',     monthly: 4.99,
    replacedBy: 'The Scanner — verdicts against YOUR membrane, not a population average' },
  { key: 'budgeting',     name: 'Budget / subscription app', monthly: 7.99,
    replacedBy: 'The Vault + this audit — savings that flow to your dreams, not a chart' },
  { key: 'language',      name: 'Language learning app',  monthly: 12.99,
    replacedBy: 'Language through survival relevance — scan the label, learn the word' },
  { key: 'meditation',    name: 'Meditation / calm app',  monthly: 14.99,
    replacedBy: 'Mental & Emotional Regulation — tuned to your biosignals, not a timer' },
  { key: 'fitness',       name: 'Workout / fitness app',  monthly: 9.99,
    replacedBy: 'Fitness & Performance — your devices already measure it; the membrane reads it' },
  { key: 'travel_deals',  name: 'Travel deals app',       monthly: 5.99,
    replacedBy: 'The Travel Engine — trips your AWARE DOLLARS fund, dossiers the Equalizer seals' },
  { key: 'pet_app',       name: 'Pet health app',         monthly: 6.99,
    replacedBy: 'K9/Feline intelligence — species toxicology on every scan, dual baselines' },
  { key: 'nutrition',     name: 'Calorie / macro tracker', monthly: 9.99,
    replacedBy: 'The Chef + Scanner — food truth before contact, not arithmetic after' },
];

export function reclaimTotal(selectedKeys: string[]): number {
  const set = new Set(selectedKeys);
  return WASTE_CATALOG.filter(w => set.has(w.key))
    .reduce((sum, w) => sum + w.monthly, 0);
}

export function wasteByKey(key: string): WasteItem | undefined {
  return WASTE_CATALOG.find(w => w.key === key);
}
