/**
 * AppTopBar — Stitch-faithful top navigation bar.
 * Matches the header from all canonical purple / orange Stitch screens.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/hooks/useTheme';

interface AppTopBarProps {
  /** Tapping the hamburger menu icon */
  onMenuPress?: () => void;
}

export function AppTopBar({ onMenuPress }: AppTopBarProps) {
  const t = useTheme();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: '#0A0A0A',
          borderBottomColor: '#2A2A2A',
        },
      ]}
    >
      {/* Left: Menu icon */}
      <TouchableOpacity
        style={styles.iconButton}
        onPress={onMenuPress}
        activeOpacity={0.7}
        accessibilityLabel="Open menu"
      >
        <Text style={[styles.icon, { color: t.primaryContainer }]}>☰</Text>
      </TouchableOpacity>

      {/* Center: App title */}
      <Text
        style={[
          styles.title,
          {
            color: t.primaryContainer,
            textShadowColor: t.glowPrimary,
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 8,
          },
        ]}
        numberOfLines={1}
      >
        ELITE PERFORMANCE
      </Text>

      {/* Right: Language toggle placeholder */}
      <View style={styles.iconButton}>
        <Text style={[styles.langLabel, { color: t.primaryContainer }]}>EN</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 64,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  iconButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 24,
  },
  title: {
    fontWeight: '900',
    fontSize: 18,
    letterSpacing: -0.5,
    textTransform: 'uppercase',
    flex: 1,
    textAlign: 'center',
  },
  langLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
