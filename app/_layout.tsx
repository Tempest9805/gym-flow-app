/**
 * Root layout.
 *
 * No account, no guard, no redirect chain: the app opens straight on the
 * training sheet. Boot is two local reads — theme and stored data — and
 * nothing else.
 */
import '../global.css';

import React, { useEffect } from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary, LoadingScreen } from '@/components/ui';
import { useRoutineStore } from '@/lib/store/routineStore';
import { useThemeStore } from '@/lib/store/themeStore';

export default function RootLayout() {
  const loadTheme = useThemeStore((s) => s.loadTheme);
  const themeLoaded = useThemeStore((s) => s.isLoaded);
  const loadData = useRoutineStore((s) => s.load);
  const dataLoaded = useRoutineStore((s) => s.isLoaded);

  // Both loaders are Zustand actions, so their identity is stable and listing
  // them here does not make this run more than once.
  useEffect(() => {
    loadTheme();
    loadData();
  }, [loadTheme, loadData]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <StatusBar style="light" />
          {themeLoaded && dataLoaded ? <Slot /> : <LoadingScreen />}
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
