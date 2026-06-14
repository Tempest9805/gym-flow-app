import React, { useEffect, useRef } from 'react';
import { Tabs, router } from 'expo-router';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useCurrentProfile, useTranslation } from '@/lib/hooks';
import type { TranslationKey } from '@/lib/hooks/useTranslation';
import { LoadingScreen } from '@/components/ui';
import { useAuthStore } from '@/lib/store/authStore';
import { useThemeStore } from '@/lib/store/themeStore';
import { useSettingsStore } from '@/lib/store/settingsStore';
import { useTheme } from '@/lib/hooks/useTheme';
import { cn } from '@/lib/utils/cn';

// Visible tabs, in footer order. Entrenar (index) is the factory default.
const TAB_ORDER = ['tree', 'index', 'exercises', 'routines', 'profile'] as const;

const TAB_META: Record<string, { outline: string; fill: string; labelKey: TranslationKey }> = {
  tree:      { outline: '◬', fill: '◬', labelKey: 'tabs.tree' },
  index:     { outline: '⌂', fill: '⌂', labelKey: 'tabs.train' },
  exercises: { outline: '◈', fill: '◈', labelKey: 'tabs.exercises' },
  routines:  { outline: '≡', fill: '≡', labelKey: 'tabs.routines' },
  profile:   { outline: '◯', fill: '●', labelKey: 'tabs.profile' },
};

function StitchTabBar({ state, navigation }: BottomTabBarProps) {
  const t = useTheme();
  const { t: tr } = useTranslation();

  // Only render the 5 primary tabs (hide hidden screens), in TAB_ORDER.
  const visibleRoutes = state.routes.filter((r) =>
    (TAB_ORDER as readonly string[]).includes(r.name)
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
      {visibleRoutes.map((route) => {
        const isFocused = state.index === state.routes.findIndex((r) => r.key === route.key);
        const meta = TAB_META[route.name] ?? { outline: '○', fill: '●', labelKey: 'tabs.train' as TranslationKey };
        const label = tr(meta.labelKey);
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
            accessibilityLabel={label}
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
              {isFocused ? meta.fill : meta.outline}
            </Text>
            <Text
              className={cn(
                'text-[10px] uppercase tracking-widest',
                isFocused ? 'font-bold' : 'font-medium'
              )}
              style={{ color }}
            >
              {label}
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
  const { startTab, isLoaded: startTabLoaded, loadStartTab } = useSettingsStore();
  const didRedirect = useRef(false);

  // Load persisted prefs on mount
  useEffect(() => {
    loadTheme();
    loadStartTab();
  }, []);

  // Cold-start redirect to the user's chosen start tab (exactly once).
  useEffect(() => {
    if (startTabLoaded && !didRedirect.current) {
      didRedirect.current = true;
      if (startTab !== 'index') {
        router.replace(`/${startTab}`);
      }
    }
  }, [startTabLoaded, startTab]);

  if (isLoading || !isAuthenticated || !isLoaded || !startTabLoaded) {
    return <LoadingScreen />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <StitchTabBar {...props} />}
    >
      <Tabs.Screen name="tree" />
      <Tabs.Screen name="index" />
      <Tabs.Screen name="exercises" />
      <Tabs.Screen name="routines" />
      <Tabs.Screen name="profile" />
      {/* Hidden screens — not in bottom nav */}
      <Tabs.Screen name="agenda" options={{ href: null }} />
      <Tabs.Screen name="workout" options={{ href: null }} />
      <Tabs.Screen name="workout-session" options={{ href: null }} />
      <Tabs.Screen name="day-detail" options={{ href: null }} />
      <Tabs.Screen name="routine-start" options={{ href: null }} />
      <Tabs.Screen name="routine-detail" options={{ href: null }} />
      <Tabs.Screen name="routine-builder" options={{ href: null }} />
      <Tabs.Screen name="import-routine" options={{ href: null }} />
      <Tabs.Screen name="exercise/[id]" options={{ href: null }} />
      <Tabs.Screen name="share/[id]" options={{ href: null }} />
      <Tabs.Screen name="timer" options={{ href: null }} />
      <Tabs.Screen name="timer-active" options={{ href: null }} />
      <Tabs.Screen name="tabata" options={{ href: null }} />
      <Tabs.Screen name="tabata-active" options={{ href: null }} />
      <Tabs.Screen name="tabata-summary" options={{ href: null }} />
    </Tabs>
  );
}
