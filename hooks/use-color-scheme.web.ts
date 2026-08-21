/**
 * ─── hooks/use-color-scheme.web.ts ─────────────────────────────────────────
 * THE DARK INSTRUMENT LAW — founder order 2026-08-21: "and fix light mode!"
 *
 * The web variant previously returned 'light' before hydration, then handed
 * over to the OS setting. AA2 has one panel and it is dark. Static render and
 * hydrated render now agree, so there is no flash between them.
 */
export function useColorScheme(): 'dark' {
  return 'dark';
}
