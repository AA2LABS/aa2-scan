// ─── lib/theme.ts ────────────────────────────────────────────────────────────
// THE CARD LAW + THE READABILITY LAW — founder rulings 2026-08-03.
//
// CARD LAW: "I like this color — it jumps out. It's lighter than the border
// and it's easier to read." One recipe, everywhere, forever:
//   · Accent card:  fill = accent at 10% · border = SAME hue at 45% · the
//     border is always STRONGER than the fill — that contrast is the pop.
//   · Hero card:    fill 14% · border 55% · 2px — reserved for the moments
//     AA2 shines (THE VERDICT, AA2 RESTATES, THE TRUE INTERPRETER).
//   · Neutral card: white 7% fill · white 15% border — retired: white 4%
//     fill on hairline, the flat card that never jumped.
//
// READABILITY LAW: "All fonts are too small throughout the app." Minimum
// sizes below. New screens use them natively; existing screens migrate on
// every touch. No body text under 13. No label under 10.5.
// ─────────────────────────────────────────────────────────────────────────────

export const PALETTE = {
  navy: '#0E1B33', ink: '#E8EEF5', mut: '#8A99AD', faint: '#5C6B80',
  gold: '#D4A847', cyan: '#1BB8FF', green: '#34D399', purple: '#B48CF2',
  red: '#E24B4A', amber: '#E0A04A',
};

/** Hex accent + alpha byte → rgba string the CARD LAW way. */
function tint(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/** THE CARD — the one recipe. Border always stronger than fill. */
export function card(accent: string) {
  return {
    backgroundColor: tint(accent, 0.10),
    borderWidth: 1,
    borderColor: tint(accent, 0.45),
    borderRadius: 14,
    padding: 16,
  } as const;
}

/** THE HERO CARD — for the moments AA2 shines. THE VERDICT format. */
export function heroCard(accent: string) {
  return {
    backgroundColor: tint(accent, 0.14),
    borderWidth: 2,
    borderColor: tint(accent, 0.55),
    borderRadius: 18,
    padding: 20,
  } as const;
}

/**
 * THE KNOWLEDGE CARD — founder law 2026-08-03:
 * "The knowledge and info should have the brown-against-blue vibe.
 *  It says STOP — this is not just an output."
 * Navy carries DATA. Amber-brown against the blue carries KNOWLEDGE —
 * the membrane speaking: THE VERDICT, AA2 RESTATES, THE TRUE INTERPRETER,
 * disagreement trials, doctrine moments. Whenever AA2 interprets rather
 * than reports, it wears this card. No exceptions.
 */
export const KNOWLEDGE_CARD = heroCard(PALETTE.amber);
export const KNOWLEDGE_TITLE = { color: PALETTE.amber, fontSize: 13, letterSpacing: 2, fontWeight: '700' as const, marginBottom: 10 };
export const KNOWLEDGE_BODY  = { color: 'rgba(232,238,245,0.88)', fontSize: 15, lineHeight: 24, fontWeight: '500' as const };

/** Neutral card — upgraded so it still jumps off the navy. */
export const NEUTRAL_CARD = {
  backgroundColor: 'rgba(255,255,255,0.07)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,0.15)',
  borderRadius: 14,
  padding: 16,
} as const;

/** READABILITY LAW — minimum type scale. */
export const TYPE = {
  heroTitle: 26,   // section heroes (THE VERDICT headline class)
  title: 18,       // card titles
  body: 13.5,      // running copy — NEVER below 13
  detail: 12,      // secondary copy
  label: 10.5,     // mono eyebrows/labels — NEVER below 10.5
  bigNum: 30,      // metric numbers
} as const;
