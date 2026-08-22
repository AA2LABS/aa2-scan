import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { useTheme } from '@/lib/theme-mode';

const TabIcon = ({ emoji, color }: { emoji: string; color: string }) => (
  <Text style={{ fontSize: 22, color }}>{emoji}</Text>
);

/**
 * THE TAB BAR IS PART OF THE PANEL.
 *
 * It used to read Colors[colorScheme].tint and nothing else — so the bar's
 * BACKGROUND stayed whatever React Navigation felt like painting. In light mode
 * that is a white bar under a light app, which is fine by accident; in dark mode
 * it was a dark bar by accident too. Accident is not a wire.
 *
 * Now the bar is drawn from the same tokens as every screen above it, so the
 * whole app is light or the whole app is dark. Founder, 2026-08-22: "there is no
 * fucking mixing both light and dark."
 *
 * LAW 1: dark values below resolve to what already shipped. Nothing moves for a
 * member who never touches the button.
 */
export default function TabLayout() {
  const T = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: T.mode === 'dark' ? '#FFFFFF' : T.blue,
        tabBarInactiveTintColor: T.faint,
        tabBarStyle: {
          backgroundColor: T.mode === 'dark' ? '#0D0A04' : T.surface,
          borderTopColor: T.line,
        },
      }}
    >
      <Tabs.Screen name="aa2"       options={{ title: 'AA2',       tabBarIcon: ({ color }) => <TabIcon emoji="🧬" color={color} /> }} />
      <Tabs.Screen name="index"     options={{ title: 'Scanner',   tabBarIcon: ({ color }) => <TabIcon emoji="⚡" color={color} /> }} />
      <Tabs.Screen name="biobuddy"  options={{ title: 'Bio Buddy', tabBarIcon: ({ color }) => <TabIcon emoji="❤️" color={color} /> }} />
      <Tabs.Screen name="concierge" options={{ title: 'Concierge', tabBarIcon: ({ color }) => <TabIcon emoji="◆" color={color} /> }} />
      <Tabs.Screen name="chef"      options={{ title: 'Chef',      tabBarIcon: ({ color }) => <TabIcon emoji="🍳" color={color} /> }} />
      <Tabs.Screen name="chauffeur" options={{ title: 'Chauffeur', tabBarIcon: ({ color }) => <TabIcon emoji="✨" color={color} /> }} />
      <Tabs.Screen name="equalizer" options={{ title: 'Equalizer', tabBarIcon: ({ color }) => <TabIcon emoji="⬡" color={color} /> }} />

      <Tabs.Screen name="onboarding" options={{ href: null }} />
      <Tabs.Screen name="apothecary" options={{ href: null }} />
      <Tabs.Screen name="explore"    options={{ href: null }} />
      <Tabs.Screen name="map"        options={{ href: null }} />
    </Tabs>
  );
}
