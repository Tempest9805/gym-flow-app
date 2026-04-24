/**
 * LoadingScreen — Reusable centralized loading state.
 */
import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { ScreenContainer } from './ScreenContainer';

interface LoadingScreenProps {
  message?: string;
  isOverlay?: boolean;
}

export function LoadingScreen({ message, isOverlay = false }: LoadingScreenProps) {
  const content = (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator size="large" color="#0072cd" />
      {message && (
        <Text className="mt-4 text-text-secondary font-semibold text-base">
          {message}
        </Text>
      )}
    </View>
  );

  if (isOverlay) {
    return (
      <View className="absolute inset-0 bg-white/80 items-center justify-center z-50">
        {content}
      </View>
    );
  }

  return (
    <ScreenContainer>
      {content}
    </ScreenContainer>
  );
}
