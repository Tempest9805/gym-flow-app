/**
 * Root layout.
 *
 * No account, no guard, no redirect chain: the app opens straight on the
 * training sheet. Boot is three local reads (theme, language, stored data)
 * and nothing else.
 */
import '../global.css';

import React, { useEffect } from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary, LoadingScreen } from '@/components/ui';
import { useLanguageStore } from '@/lib/store/languageStore';
import { useRoutineStore } from '@/lib/store/routineStore';
import { useThemeStore } from '@/lib/store/themeStore';

export default function RootLayout() {
  const loadTheme = useThemeStore((s) => s.loadTheme);
  const themeLoaded = useThemeStore((s) => s.isLoaded);
  const loadLanguage = useLanguageStore((s) => s.loadLanguage);
  const loadData = useRoutineStore((s) => s.load);
  const dataLoaded = useRoutineStore((s) => s.isLoaded);

  useEffect(() => {
    loadTheme();
    loadLanguage();
    loadData();
  }, []);

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
