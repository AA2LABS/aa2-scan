import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import { useFonts } from 'expo-font';
import { router, Stack, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { loadMemberProfile } from '@/lib/db';
import { SEAL_FLAG_PATH } from './arrival';

export const unstable_settings = {
  anchor: '(tabs)',
};

/**
 * THE DARK INSTRUMENT LAW — founder order 2026-08-21: "and fix light mode!"
 * React Navigation paints the ground UNDER every route. On a light-mode phone
 * the old `colorScheme === 'dark' ? DarkTheme : DefaultTheme` handed it
 * DefaultTheme — a WHITE card and a WHITE background behind AA2's near-black
 * screens. Every route flashed white on push, on pop, and behind every modal.
 * AA2's ground is Earth #0D0A04. It is now the ground in the navigator too.
 */
const AA2_GROUND = '#0D0A04';
const AA2_NAV_THEME = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: AA2_GROUND, card: AA2_GROUND },
};

export default function RootLayout() {

  // The wire typography — Bebas display, Cormorant serif, DM Mono, DM Sans.
  // Screens already reference these family names; this makes them real.
  // Never blocks first paint: system fallback until loaded, then wire type.
  useFonts({
    'BebasNeue-Regular':          require('../assets/fonts/BebasNeue-Regular.ttf'),
    'CormorantGaramond-Regular':  require('../assets/fonts/CormorantGaramond-Variable.ttf'),
    'CormorantGaramond-Medium':   require('../assets/fonts/CormorantGaramond-Variable.ttf'),
    'CormorantGaramond-Italic':   require('../assets/fonts/CormorantGaramond-Italic-Variable.ttf'),
    'DMMono-Regular':             require('../assets/fonts/DMMono-Regular.ttf'),
    'DMMono-Medium':              require('../assets/fonts/DMMono-Medium.ttf'),
    'DMSans-Regular':             require('../assets/fonts/DMSans-Variable.ttf'),
  });

  useEffect(() => {
    (async () => {
      // THE SKIN LAW (Canon v17 §2 · Initiate Doctrine): "Onboarding IS the
      // initiation. The 20 questions ARE the ritual. No one enters the
      // membrane without passing through the skin." The gate order:
      //   1. Never arrived        → arrival cover (CES flip-book door)
      //   2. Arrived, not sealed  → the initiation (stories → blocks → seal)
      //   3. Sealed               → the membrane opens (Concierge hosts)
      try {
        // ARRIVAL COVER CUT (founder order 2026-08-01): its "synced / off-grid"
        // copy claimed state that does not exist — a Representative Doctrine
        // violation on the front porch. The Nine Stories ARE the welcome.
        const sealedLocal = await FileSystem.getInfoAsync(SEAL_FLAG_PATH);
        if (sealedLocal.exists) {
          setTimeout(() => router.replace('/concierge' as Href), 100);
          return;
        }
        // No local seal — ask the membrane itself (returning member,
        // fresh install). If the profile says sealed, restore the flag.
        let sealed = false;
        try {
          const prof = await loadMemberProfile();
          sealed = !!prof?.onboardingComplete;
        } catch {}
        if (sealed) {
          try { await FileSystem.writeAsStringAsync(SEAL_FLAG_PATH, '1'); } catch {}
          setTimeout(() => router.replace('/concierge' as Href), 100);
        } else {
          setTimeout(() => router.replace('/onboarding' as Href), 100);
        }
      } catch {
        setTimeout(() => router.replace('/onboarding' as Href), 100);
      }
    })();
  }, []);

  return (
    <ThemeProvider value={AA2_NAV_THEME}>
      <Stack screenOptions={{ contentStyle: { backgroundColor: AA2_GROUND } }}>
        <Stack.Screen name="arrival" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="biomarkers" options={{ headerShown: false }} />
        <Stack.Screen name="membrane" options={{ headerShown: false }} />
        <Stack.Screen name="vault" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
