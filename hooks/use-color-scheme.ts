/**
 * ─── hooks/use-color-scheme.ts ──────────────────────────────────────────────
 * THE DARK INSTRUMENT LAW — founder order 2026-08-21: "and fix light mode!"
 *
 * AA2 is a dark instrument panel. Every screen in this app is hand-painted
 * against near-black (#0D0A04 Earth, #030D14 Ocean, #040D08 Alpine, #080808
 * Obsidian, #0F0A04 Desert) with white and gold type sitting on white-6%
 * glass. There is no light palette for those screens and there never was.
 *
 * The stock Expo template shipped `userInterfaceStyle: automatic`, so when the
 * member's PHONE was set to Light, this hook returned 'light' and:
 *   - React Navigation painted DefaultTheme WHITE behind every route
 *   - useThemeColor() resolved Colors.light -> #fff background, #11181C text
 *   - the tab bar tint flipped to #0a7ea4
 *   - map.tsx flipped its 5 theme tokens to cream (#FAF7F2) while the other
 *     forty colours on that screen stayed white -> white text on cream
 *   - the splash flashed #ffffff before a black app
 *
 * That is not a light mode. That is a leak. The panel is locked dark.
 *
 * LAW 1 HONOURED: this changes no screen's appearance, layout or copy. It
 * makes the app render AS DESIGNED on a light-mode phone. Rewire only.
 */
export function useColorScheme(): 'dark' {
  return 'dark';
}
