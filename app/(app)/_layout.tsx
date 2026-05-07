/**
 * App Layout — Stitch-faithful bottom navigation.
 * Tabs: Home | Exercises | Agenda | Routines | Profile
 * Colors driven by the active theme (purple / orange).
 */
import React, { useEffect } from 'react';
import { Tabs, usePathname } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useCurrentProfile } from '@/lib/hooks';
import { LoadingScreen } from '@/components/ui';
import { useAuthStore } from '@/lib/store/authStore';
import { useThemeStore } from '@/lib/store/themeStore';
import { useTheme } from '@/lib/hooks/useTheme';

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
function StitchTabBar({ state, descriptors, navigation }: any) {
  const t = useTheme();

  // Only render the 5 primary tabs (hide hidden screens)
  const visibleRoutes = state.routes.filter((r: any) =>
    ['index', 'exercises', 'agenda', 'routines', 'profile'].includes(r.name)
  );

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: t.background + 'EE',
          borderTopColor: t.surfaceContainerHighest,
          shadowColor: '#000',
        },
      ]}
    >
      {visibleRoutes.map((route: any) => {
        const isFocused = state.routes[state.index].name === route.name;
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
            style={styles.tabItem}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={iconDef.label}
          >
            {isFocused && (
              <View
                style={[
                  styles.activeIndicator,
                  { backgroundColor: t.primaryContainer },
                ]}
              />
            )}
            <Text
              style={[
                styles.tabIcon,
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
              style={[
                styles.tabLabel,
                { color },
                isFocused && { fontWeight: '700' },
              ]}
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

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    height: 80,
    paddingBottom: Platform.OS === 'ios' ? 16 : 8,
    borderTopWidth: 1,
    shadowOpacity: 0.5,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 20,
    elevation: 20,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    paddingTop: 6,
  },
  activeIndicator: {
    position: 'absolute',
    top: -2,
    width: 40,
    height: 3,
    borderRadius: 2,
  },
  tabIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});