import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const TabIcon = ({ emoji, color }: { emoji: string; color: string }) => (
  <Text style={{ fontSize: 22, color }}>{emoji}</Text>
);

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
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
