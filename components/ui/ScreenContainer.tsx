/**
 * ScreenContainer — Standard screen wrapper.
 * Provides safe area insets, consistent padding, and background.
 */
import React, { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenContainerProps {
  children: ReactNode;
  className?: string;
}

export function ScreenContainer({ children, className = '' }: ScreenContainerProps) {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <View className={`flex-1 px-5 pt-4 ${className}`}>
        {children}
      </View>
    </SafeAreaView>
  );
}
