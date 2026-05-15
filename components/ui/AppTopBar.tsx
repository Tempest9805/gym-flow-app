/**
 * AppTopBar — Stitch-faithful top navigation bar.
 * Matches the header from all canonical purple / orange Stitch screens.
 * Now includes a Hamburger Menu Modal for Utility Features (Timer, Tabata).
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/hooks/useTheme';
import { useRouter } from 'expo-router';

interface AppTopBarProps {
  /** Tapping the hamburger menu icon (optional override) */
  onMenuPress?: () => void;
}

export function AppTopBar({ onMenuPress }: AppTopBarProps) {
  const t = useTheme();
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);

  const handleMenuPress = () => {
    if (onMenuPress) {
      onMenuPress();
    } else {
      setMenuVisible(true);
    }
  };

  const closeMenu = () => setMenuVisible(false);

  const navigateTo = (path: any) => {
    closeMenu();
    router.push(path);
  };

  return (
    <>
      <View
        className="flex-row items-center justify-between h-16 px-5 border-b"
        style={{
          backgroundColor: '#0A0A0A',
          borderBottomColor: '#2A2A2A',
        }}
      >
        {/* Left: Menu icon */}
        <TouchableOpacity
          className="w-12 h-12 items-center justify-center"
          onPress={handleMenuPress}
          activeOpacity={0.7}
          accessibilityLabel="Open menu"
        >
          <Text className="text-2xl" style={{ color: t.primaryContainer }}>☰</Text>
        </TouchableOpacity>

        {/* Center: App title */}
        <Text
          className="flex-1 text-center font-black text-lg tracking-tight uppercase"
          style={{
            color: t.primaryContainer,
            textShadowColor: t.glowPrimary,
            textShadowOffset: { width: 0, height: 0 },
            textShadowRadius: 8,
          }}
          numberOfLines={1}
        >
          ELITE PERFORMANCE
        </Text>

        {/* Right: Language toggle placeholder */}
        <View className="w-12 h-12 items-center justify-center">
          <Text className="text-[12px] font-bold tracking-widest uppercase" style={{ color: t.primaryContainer }}>EN</Text>
        </View>
      </View>

      {/* Hamburger Menu Modal */}
      <Modal
        visible={menuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <View className="flex-1 flex-row">
          <TouchableWithoutFeedback onPress={closeMenu}>
            <View className="absolute inset-0 bg-black/60" />
          </TouchableWithoutFeedback>
          <SafeAreaView 
            className="w-3/4 max-w-[320px] h-full shadow-2xl elevation-24" 
            style={{ backgroundColor: t.surface, shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20 }}
          >
            <View className="flex-row items-center justify-between p-6 pt-4 border-b" style={{ borderBottomColor: t.surfaceContainerHighest }}>
              <Text className="text-base font-extrabold tracking-[2px] uppercase" style={{ color: t.onSurface }}>UTILITIES</Text>
              <TouchableOpacity onPress={closeMenu} className="p-2 -mr-2">
                <Text className="text-xl font-semibold" style={{ color: t.onSurfaceVariant }}>✕</Text>
              </TouchableOpacity>
            </View>
            <View className="flex-1 px-4 pt-4">
              <TouchableOpacity
                className="flex-row items-center justify-between py-5 border-b"
                style={{ borderBottomColor: t.surfaceContainerHighest }}
                activeOpacity={0.7}
                onPress={() => navigateTo('/timer')}
              >
                <Text className="text-lg font-bold" style={{ color: t.onSurface }}>⚡ Interval Timer</Text>
                <Text className="text-2xl" style={{ color: t.outlineVariant }}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-row items-center justify-between py-5 border-b"
                style={{ borderBottomColor: t.surfaceContainerHighest }}
                activeOpacity={0.7}
                onPress={() => navigateTo('/tabata')}
              >
                <Text className="text-lg font-bold" style={{ color: t.onSurface }}>◆ Tabata Protocol</Text>
                <Text className="text-2xl" style={{ color: t.outlineVariant }}>›</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </Modal>
    </>
  );
}
