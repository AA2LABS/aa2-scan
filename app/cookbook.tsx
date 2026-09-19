import React, { useEffect, useState } from 'react';
import { DoorFlood, useProfile, type Row, GREEN, AMBER, GOLD } from '@/components/DoorFlood';
import { getCookbookRecipes } from '@/lib/db';

// ─────────────────────────────────────────────────────────────────────────────
// THE COOKBOOK — wired 2026-09-12 on founder order "build the doors to match
// the document." assets/doors/_MANIFEST.txt listed door-cookbook.jpg under
// "STAGED, NOT WIRED (no screen exists yet for them — ask for the wire)".
// This is the wire. The Chef's own inline cookbook drawer is UNTOUCHED —
// never change a wire screen that was right. This is the standalone door.
// ─────────────────────────────────────────────────────────────────────────────

const SAFFRON = '#E0A04A';

export default function CookbookScreen() {
  const { p } = useProfile();
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getCookbookRecipes(50)
      .then((r) => { setRecipes(Array.isArray(r) ? r : []); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  const allergens = p?.foodAllergens ?? [];
  const n = recipes.length;
  const latest = n ? String(recipes[0]?.recipe_name ?? recipes[0]?.name ?? 'your last save') : null;

  const rows: Row[] = [
    { icon: '📖', title: 'Your saved recipes',
      desc: !loaded ? 'Opening the cookbook…'
            : n ? `${n} saved. Most recent: ${latest}.`
                : 'Nothing saved yet. Save from the Chef and it lands here.',
      chip: !loaded ? '…' : n ? String(n) : 'EMPTY',
      chipColor: n ? SAFFRON : AMBER },

    { icon: '🌍', title: 'International live cooking',
      desc: 'Regional naming, preparation context, and the substitution that keeps the dish honest where you are.',
      chip: 'LIVE', chipColor: SAFFRON },

    { icon: '🛡️', title: 'The allergen guard travels with the recipe',
      desc: allergens.length
        ? `Every saved dish re-checked against: ${allergens.join(', ')}.`
        : 'No food allergens declared. Declare them and every saved dish is re-checked.',
      chip: allergens.length ? 'ARMED' : 'OPEN',
      chipColor: allergens.length ? GREEN : AMBER },

    { icon: '🖨️', title: 'The Paper Layer',
      desc: 'Full ingredient list, method, cook times — printable, so the kitchen does not need a screen.',
      chip: 'PRINT', chipColor: GOLD },

    { icon: '🍳', title: 'Back to the Chef',
      desc: 'Build a new recipe to your profile, then save it into this book.',
      chip: 'OPEN', chipColor: SAFFRON,
      route: '/(tabs)/chef' },
  ];

  return (
    <DoorFlood
      art={require('@/assets/doors/door-cookbook.jpg')}
      eyebrow="THE CHEF · 0X02"
      title="The Cookbook"
      accent={SAFFRON}
      heroLine="International live cooking recipes."
      heroSub="Every dish you saved, still reading your biology — not a generic one."
      rows={rows}
      foot="Cultural curiosity without risk."
    />
  );
}
