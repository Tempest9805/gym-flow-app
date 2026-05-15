/**
 * LoadingScreen — Themed loading state matching Stitch dark aesthetic.
 * Uses PURPLE_THEME as the baseline since it's called before theme is loaded.
 */
import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PURPLE_THEME } from '@/lib/store/themeStore';

interface LoadingScreenProps {
  message?: string;
  isOverlay?: boolean;
}

export function LoadingScreen({ message, isOverlay = false }: LoadingScreenProps) {
  const t = PURPLE_THEME.tokens;

  const content = (
    <View className="flex-1 items-center justify-center gap-6 p-6">
      <ExpoImage
        source={require('@/assets/logo_nobk.png')}
        className="w-[280px] h-[280px]"
        contentFit="contain"
      />
      <ActivityIndicator
        size="large"
        color={t.primaryContainer}
      />
      {message && (
        <Text className="text-sm font-semibold tracking-widest uppercase" style={{ color: t.onSurfaceVariant }}>
          {message}
        </Text>
      )}
    </View>
  );

  if (isOverlay) {
    return (
      <View className="absolute inset-0 items-center justify-center z-[50]" style={{ backgroundColor: 'rgba(10,10,10,0.85)' }}>
        {content}
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: '#0A0A0A' }}>
      {content}
    </SafeAreaView>
  );
}