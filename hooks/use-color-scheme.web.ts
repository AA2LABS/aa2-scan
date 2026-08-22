/**
 * ─── hooks/use-color-scheme.web.ts ─────────────────────────────────────────
 * THE MEMBER PICKS. NOT THE BROWSER.
 *
 * Same choke point as the native file. The member's stored pick is read from
 * the vault, so the static render and the hydrated render agree once the
 * provider is ready — and until it is ready the provider reports DARK, which
 * is what shipped, so nobody sees a flash into a mode they did not choose.
 */
import { useThemeControl } from '@/lib/theme-mode';

export function useColorScheme(): 'light' | 'dark' {
  return useThemeControl().tokens.mode;
}
