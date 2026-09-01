/**
 * Tab navigator — four tabs, everything else hidden.
 *
 * Hoy is first and is where the app opens. The rest exist to feed it:
 * routines to pick from, exercises to add, settings to tweak.
 */
import React from 'react';
import { Tabs } from 'expo-router';
import { View, Text, Pressable, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { useTheme } from '@/lib/hooks/useTheme';

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>['name'];

/** Visible tabs, in footer order. */
const TABS: { name: string; label: string; icon: IconName }[] = [
  { name: 'index', label: 'Hoy', icon: 'clipboard-check-outline' },
  { name: 'routines', label: 'Rutinas', icon: 'view-list-outline' },
  { name: 'exercises', label: 'Ejercicios', icon: 'dumbbell' },
  { name: 'settings', label: 'Ajustes', icon: 'cog-outline' },
];

function TabBar({ state, navigation }: BottomTabBarProps) {
  const t = useTheme();
  const activeName = state.routes[state.index]?.name;

  return (
    <View
      className="flex-row border-t"
      style={{
        backgroundColor: t.surfaceContainerLowest,
        borderTopColor: t.outlineVariant,
        paddingBottom: Platform.OS === 'ios' ? 24 : 10,
        paddingTop: 10,
      }}
    >
      {TABS.map((tab) => {
        const isActive = activeName === tab.name;
        const color = isActive ? t.primaryContainer : t.onSurfaceVariant;

        return (
          <Pressable
            key={tab.name}
            accessibilityRole="button"
            accessibilityState={isActive ? { selected: true } : {}}
            accessibilityLabel={tab.label}
            className="flex-1 items-center justify-center gap-1"
            style={{ minHeight: 48 }}
            onPress={() => {
              if (!isActive) navigation.navigate(tab.name);
            }}
          >
            <MaterialCommunityIcons name={tab.icon} size={24} color={color} />
            <Text className="text-[11px] font-semibold" style={{ color }}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function AppLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <TabBar {...props} />}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="routines" />
      <Tabs.Screen name="exercises" />
      <Tabs.Screen name="settings" />

      {/* Reachable from inside the tabs, never from the footer. */}
      <Tabs.Screen name="exercise/[id]" options={{ href: null }} />
      <Tabs.Screen name="timer" options={{ href: null }} />
      <Tabs.Screen name="timer-active" options={{ href: null }} />
      <Tabs.Screen name="tabata" options={{ href: null }} />
      <Tabs.Screen name="tabata-active" options={{ href: null }} />
      <Tabs.Screen name="tabata-summary" options={{ href: null }} />
    </Tabs>
  );
}
