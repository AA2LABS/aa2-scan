import { DarkTheme, ThemeProvider } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import { useFonts } from 'expo-font';
import { router, Stack, usePathname, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { loadMemberProfile } from '@/lib/db';
import { ensureSession } from '@/lib/session';
import { lastRoute, rememberRoute } from '@/lib/lastRoute';
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
        // THE MEMBRANE OPENS FIRST — founder order 2026-08-21, "NO REASON IT
        // ALL SHOULD NOT WORK." Twenty-five readers and writers in lib/ start
        // with auth.getUser(). Exactly one screen ever created a session, so a
        // returning member met an app that answered "nothing" to every
        // question. The session is now guaranteed before any screen asks.
        await ensureSession();

        // ARRIVAL COVER CUT (founder order 2026-08-01): its "synced / off-grid"
        // copy claimed state that does not exist — a Representative Doctrine
        // violation on the front porch. The Nine Stories ARE the welcome.
        // WHERE YOU LEFT OFF (founder order 2026-08-22). A sealed member used
        // to land on /concierge every single launch — "all the doors in one
        // place," which was never where he came from. Now the last room he
        // actually stood in opens, and the hub is only the fallback.
        const sealedLocal = await FileSystem.getInfoAsync(SEAL_FLAG_PATH);
        if (sealedLocal.exists) {
          const back = (await lastRoute()) ?? '/concierge';
          setTimeout(() => router.replace(back as Href), 100);
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
          const back = (await lastRoute()) ?? '/concierge';
          setTimeout(() => router.replace(back as Href), 100);
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
      {/* Records the room the member is standing in. Renders nothing, touches
          no screen's appearance, layout or copy — Law 1. Rewire only. */}
      <RouteMemory />
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

/**
 * THE ROOM RECORDER. Writes the current door to the vault on every change so
 * the next launch can open it. Nothing is rendered; nothing is blocked.
 */
function RouteMemory() {
  const pathname = usePathname();
  useEffect(() => { rememberRoute(pathname); }, [pathname]);
  return null;
}
