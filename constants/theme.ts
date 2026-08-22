/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorDark = '#fff';

export const Colors = {
  // TWO MODES. ONE BUTTON. THE WHOLE APP. — founder ruling 2026-08-22.
  //
  // CORRECTION LOGGED, NOT ERASED. From 2026-08-21 to 2026-08-22 `light` was a
  // MIRROR of dark, under THE DARK INSTRUMENT LAW. That law is struck: he asked
  // for light mode fixed, not deleted, and he had already designed both modes a
  // year earlier. `light` is a real mode again, and every value below is lifted
  // from his own file (lib/theme-mode.ts LIGHT) — none of it is invented here.
  light: {
    text: '#1a1a1a',            // LIGHT.ink
    background: '#F0EEE8',      // LIGHT.bg   — the page ground
    tint: '#2a7faa',            // LIGHT.blue — the paired accent, not #0a7ea4
    icon: 'rgba(0,0,0,0.55)',   // LIGHT.mut
    tabIconDefault: 'rgba(0,0,0,0.38)', // LIGHT.faint
    tabIconSelected: '#2a7faa',
  },
  dark: {
    text: '#ECEDEE',
    // #151718 was the template's grey. AA2's true ground is Earth #0D0A04 —
    // the default palette in app/(tabs)/index.tsx. No seam between the
    // navigation ground and the screen ground. UNCHANGED by the two-mode work:
    // dark is exactly what shipped, so nobody's app moves under them.
    background: '#0D0A04',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
