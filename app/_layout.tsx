/**
 * Root layout — Entry point for Expo Router.
 * Wraps the app with providers (React Query, Error Boundary)
 * and imports the global NativeWind stylesheet.
 */
import '../global.css';

import React, { useEffect } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryProvider } from '@/lib/utils/queryProvider';
import { ErrorBoundary } from '@/components/ui';
import { useAuthStore } from '@/lib/store/authStore';

/**
 * Navigation guard: redirects based on auth state.
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    // Not authenticated - go to login
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }

    // Authenticated and in auth group - go to app
    if (isAuthenticated && inAuthGroup) {
      router.replace('/(app)');
      return;
    }
  }, [isAuthenticated, isLoading, segments, router]);

  return <>{children}</>;
}

export default function RootLayout() {
  const { initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ErrorBoundary>
          <QueryProvider>
            <StatusBar style="auto" />
            <AuthGuard>
              <Slot />
            </AuthGuard>
          </QueryProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
