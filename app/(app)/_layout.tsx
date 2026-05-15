import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useCurrentProfile } from '@/lib/hooks';
import { LoadingScreen } from '@/components/ui';
import { useAuthStore } from '@/lib/store/authStore';
import { useThemeStore } from '@/lib/store/themeStore';
import { useTheme } from '@/lib/hooks/useTheme';
import { cn } from '@/lib/utils/cn';

// ──────────────────────────────────────────────────────────────────────────────
// Tab icon definitions (matching Stitch bottom nav)
// ──────────────────────────────────────────────────────────────────────────────
const TAB_ICONS: Record<string, { outline: string; fill: string; label: string }> = {
  index:           { outline: '⌂',  fill: '⌂',  label: 'Home' },
  exercises:       { outline: '◈',  fill: '◈',  label: 'Exercises' },
  agenda:          { outline: '▦',  fill: '▦',  label: 'Agenda' },
  routines:        { outline: '≡',  fill: '≡',  label: 'Routines' },
  profile:         { outline: '◯',  fill: '●',  label: 'Profile' },
};

// Custom tab bar that matches Stitch design exactly
function StitchTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const t = useTheme();

  // Only render the 5 primary tabs (hide hidden screens)
  const visibleRoutes = state.routes.filter((r) =>
    ['index', 'exercises', 'agenda', 'routines', 'profile'].includes(r.name)
  );

  return (
    <View
      className="flex-row h-20 border-t shadow-2xl elevation-2xl"
      style={{
        backgroundColor: t.background + 'EE',
        borderTopColor: t.surfaceContainerHighest,
        shadowColor: '#000',
        paddingBottom: Platform.OS === 'ios' ? 16 : 8,
      }}
    >
      {visibleRoutes.map((route, index) => {
        const isFocused = state.index === state.routes.findIndex(r => r.key === route.key);
        const iconDef = TAB_ICONS[route.name] ?? { outline: '○', fill: '●', label: route.name };
        const color = isFocused ? t.primaryContainer : 'rgba(255,255,255,0.4)';

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            className="flex-1 items-center justify-center relative pt-1.5"
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={iconDef.label}
          >
            {isFocused && (
              <View
                className="absolute -top-0.5 w-10 h-1 rounded-sm"
                style={{ backgroundColor: t.primaryContainer }}
              />
            )}
            <Text
              className="text-[22px] mb-0.5"
              style={[
                { color },
                isFocused && {
                  textShadowColor: t.glowPrimary,
                  textShadowOffset: { width: 0, height: 0 },
                  textShadowRadius: 10,
                },
              ]}
            >
              {isFocused ? iconDef.fill : iconDef.outline}
            </Text>
            <Text
              className={cn(
                "text-[10px] uppercase tracking-widest",
                isFocused ? "font-bold" : "font-medium"
              )}
              style={{ color }}
            >
              {iconDef.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function AppLayout() {
  const { isAuthenticated } = useAuthStore();
  const { data: profile, isLoading } = useCurrentProfile();
  const { loadTheme, isLoaded } = useThemeStore();

  // Load persisted theme on mount
  useEffect(() => {
    loadTheme();
  }, []);

  if (isLoading || !isAuthenticated || !isLoaded) {
    return <LoadingScreen />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <StitchTabBar {...props} />}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="exercises" />
      <Tabs.Screen name="agenda" />
      <Tabs.Screen name="routines" />
      <Tabs.Screen name="profile" />
      {/* Hidden screens — not in bottom nav */}
      <Tabs.Screen name="workout" options={{ href: null }} />
      <Tabs.Screen name="workout-session" options={{ href: null }} />
      <Tabs.Screen name="day-detail" options={{ href: null }} />
      <Tabs.Screen name="routine-builder" options={{ href: null }} />
      <Tabs.Screen name="import-routine" options={{ href: null }} />
      <Tabs.Screen name="exercise/[id]" options={{ href: null }} />
      <Tabs.Screen name="share/[id]" options={{ href: null }} />
      <Tabs.Screen name="timer" options={{ href: null }} />
      <Tabs.Screen name="timer-active" options={{ href: null }} />
      <Tabs.Screen name="tabata" options={{ href: null }} />
      <Tabs.Screen name="tabata-active" options={{ href: null }} />
    </Tabs>
  );
}