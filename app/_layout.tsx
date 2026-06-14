/**
 * Root layout — Entry point for Expo Router.
 * Wraps the app with providers (React Query, Error Boundary)
 * and imports the global NativeWind stylesheet.
 * Initializes both auth and theme stores on boot.
 */
import '../global.css';

import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryProvider } from '@/lib/utils/queryProvider';
import { ErrorBoundary, LoadingScreen } from '@/components/ui';
import { useAuthStore } from '@/lib/store/authStore';
import { useThemeStore } from '@/lib/store/themeStore';
import { useCurrentProfile } from '@/lib/hooks/useProfiles';

/**
 * Navigation guard: redirects based on auth state.
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuthStore();
  const segments = useSegments();
  const { data: profile, isLoading: isProfileLoading } = useCurrentProfile();

  if (isAuthLoading || (isAuthenticated && isProfileLoading)) {
    return <LoadingScreen />;
  }

  const inAuthGroup = segments[0] === '(auth)';
  const inOnboardingGroup = segments[0] === 'onboarding';

  if (!isAuthenticated && !inAuthGroup) {
    return <Redirect href="/(auth)/login" />;
  }

  if (isAuthenticated && profile && !profile.goal && !inOnboardingGroup) {
    return <Redirect href="/onboarding/goal" />;
  }

  if (isAuthenticated && inAuthGroup) {
    return <Redirect href="/(app)" />;
  }

  return <>{children}</>;
}

import { useLanguageStore } from '@/lib/store/languageStore';

export default function RootLayout() {
  const { initialize } = useAuthStore();
  const { loadTheme } = useThemeStore();
  const { loadLanguage } = useLanguageStore();

  useEffect(() => {
    // Boot auth, theme, and language in parallel on startup
    initialize();
    loadTheme();
    loadLanguage();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryProvider>
            {/* Always dark status bar to match Stitch dark backgrounds */}
            <StatusBar style="light" />
            <AuthGuard>
              <Slot />
            </AuthGuard>
          </QueryProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
