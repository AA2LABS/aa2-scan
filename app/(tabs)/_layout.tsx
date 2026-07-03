import { Tabs } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';

const ACTIVE = '#D4A847';

const TabIcon = ({ emoji, color }: { emoji: string; color: string }) => (
  <Text style={{ fontSize: 20, color }}>{emoji}</Text>
);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: '#5C6B80',
        tabBarStyle: { backgroundColor: '#0A1426', borderTopColor: 'rgba(255,255,255,0.08)' },
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen name="index"     options={{ title: 'Scanner',   tabBarIcon: ({ color }) => <TabIcon emoji="\u229A" color={color} /> }} />
      <Tabs.Screen name="biobuddy"  options={{ title: 'Bio Buddy', tabBarIcon: ({ color }) => <TabIcon emoji="\u2665" color={color} /> }} />
      <Tabs.Screen name="aa2"       options={{ title: 'AA2',       tabBarIcon: ({ color }) => <TabIcon emoji="\u25C6" color={color} /> }} />
      <Tabs.Screen name="concierge" options={{ title: 'Concierge', tabBarIcon: ({ color }) => <TabIcon emoji="\u25A4" color={color} /> }} />
      <Tabs.Screen name="chef"      options={{ title: 'Chef',      tabBarIcon: ({ color }) => <TabIcon emoji="\u2726" color={color} /> }} />
      <Tabs.Screen name="chauffeur" options={{ title: 'Chauffeur', tabBarIcon: ({ color }) => <TabIcon emoji="\u22B3" color={color} /> }} />
      <Tabs.Screen name="equalizer" options={{ title: 'Equalizer', tabBarIcon: ({ color }) => <TabIcon emoji="\u2263" color={color} /> }} />

      <Tabs.Screen name="apothecary" options={{ href: null }} />
      <Tabs.Screen name="explore"    options={{ href: null }} />
      <Tabs.Screen name="map"        options={{ href: null }} />
    </Tabs>
  );
}
