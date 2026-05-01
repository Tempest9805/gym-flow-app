/**
 * LoadingScreen — Themed loading state matching Stitch dark aesthetic.
 * Uses PURPLE_THEME as the baseline since it's called before theme is loaded.
 */
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PURPLE_THEME } from '@/lib/store/themeStore';

interface LoadingScreenProps {
  message?: string;
  isOverlay?: boolean;
}

export function LoadingScreen({ message, isOverlay = false }: LoadingScreenProps) {
  const t = PURPLE_THEME.tokens;

  const content = (
    <View style={styles.inner}>
      <Text
        style={[
          styles.appTitle,
          {
            color: t.primaryContainer,
            textShadowColor: t.glowPrimary,
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 12,
          },
        ]}
      >
        ELITE PERFORMANCE
      </Text>
      <ActivityIndicator
        size="large"
        color={t.primaryContainer}
        style={styles.spinner}
      />
      {message && (
        <Text style={[styles.message, { color: t.onSurfaceVariant }]}>
          {message}
        </Text>
      )}
    </View>
  );

  if (isOverlay) {
    return (
      <View style={[styles.overlay, { backgroundColor: 'rgba(10,10,10,0.85)' }]}>
        {content}
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: '#0A0A0A' }]}>
      {content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    padding: 24,
  },
  appTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
    textTransform: 'uppercase',
  },
  spinner: {},
  message: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
});