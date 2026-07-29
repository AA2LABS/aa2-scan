import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import { useFonts } from 'expo-font';
import { router, Stack, type Href } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { ARRIVAL_FLAG_PATH } from './arrival';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

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
      try {
        const info = await FileSystem.getInfoAsync(ARRIVAL_FLAG_PATH);
        if (!info.exists) {
          setTimeout(() => router.replace('/arrival'), 100);
        } else {
          setTimeout(() => router.replace('/concierge' as Href), 100);
        }
      } catch {
        setTimeout(() => router.replace('/arrival'), 100);
      }
    })();
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="arrival" options={{ headerShown: false, animation: 'none' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="biomarkers" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="light" />
    </ThemeProvider>
  );
}
