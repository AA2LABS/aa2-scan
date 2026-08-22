/**
 * ─── hooks/use-color-scheme.ts ──────────────────────────────────────────────
 * THE MEMBER PICKS. NOT THE PHONE.
 *
 * FOUNDER, 2026-08-22:
 *   "The member still picks because they are able to click the button that
 *    chooses light or dark. If you make a light version, there is no fucking
 *    mixing both light and dark. The whole app would be light. The whole app
 *    would be dark. Done it before. A year ago. Tactical and K-9 are the only
 *    dark everything."
 *
 * ── CORRECTION, LOGGED NOT ERASED ──────────────────────────────────────────
 * On 2026-08-21 he said "and fix light mode!" and this file was made to
 * `return 'dark'` — THE DARK INSTRUMENT LAW. That law is STRUCK. He asked for
 * light mode FIXED, not removed, and AA2 already had both modes fully designed
 * a year earlier (`aa2_all10_both_modes_2.html`, ten surfaces, both modes).
 * The reasoning behind the struck law survives in the build record; it is
 * history now, not the standard. THE REGIME LAW.
 *
 * ── WHY THIS NO LONGER READS THE OS ────────────────────────────────────────
 * The old leak was `useColorScheme()` from react-native reporting the PHONE's
 * setting into an app that has its own panel. AA2 does not follow the phone.
 * It follows the button. This hook is now the single choke point that reports
 * what the MEMBER picked, so the tab layout, the collapsible, the parallax
 * header and useThemeColor all move together — or none of them move.
 */
import { useThemeControl } from '@/lib/theme-mode';

export function useColorScheme(): 'light' | 'dark' {
  // .tokens, not .picked — a forced-dark route (K9 · Tactical) must report
  // dark to every consumer, or the tab bar goes light under a dark screen.
  return useThemeControl().tokens.mode;
}
