/**
 * Profile Screen — Stitch `profile_orange` layout:
 *   1. TopAppBar
 *   2. Profile header bento (avatar card + stats grid)
 *   3. Preferences settings list (Theme + Language + Notifications + Units)
 *   4. Theme selector (inline in Preferences — tap → modal/toggle)
 *   5. Danger Zone: LOGOUT
 *
 * Theme selector matches the Stitch pattern:
 *   - One-tap selection inside settings list
 *   - Clear active state (colored pill or checkmark)
 *   - Minimal and premium
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppTopBar } from '@/components/ui/AppTopBar';
import { useTheme, useThemeStore } from '@/lib/hooks/useTheme';
import { useCurrentProfile } from '@/lib/hooks';
import { useAuthStore } from '@/lib/store/authStore';
import type { ThemeId } from '@/lib/store/themeStore';
import { THEMES } from '@/lib/store/themeStore';

export default function ProfileScreen() {
  const t = useTheme();
  const { themeId, setTheme } = useThemeStore();
  const { data: profile } = useCurrentProfile();
  const { signOut } = useAuthStore();
  const [themeModalVisible, setThemeModalVisible] = useState(false);

  const athleteName = profile?.full_name || profile?.email?.split('@')[0] || 'Athlete';

  return (
    <SafeAreaView 
      className="flex-1" 
      style={{ backgroundColor: t.background }} 
      edges={['top']}
    >
      <AppTopBar />
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: t.background }}
        contentContainerStyle={{ 
          paddingTop: 16, 
          paddingHorizontal: 24, 
          paddingBottom: 120, 
          gap: 40 
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Header Bento ── */}
        <View className="flex-row gap-4 flex-wrap">
          {/* Avatar card */}
          <View 
            className="flex-1 min-w-[140px] rounded-xl p-6 items-center justify-center min-h-[200px] gap-3"
            style={{ backgroundColor: t.surfaceContainer }}
          >
            <View
              className="w-24 h-24 rounded-full border-2 overflow-hidden shadow-2xl elevation-md"
              style={{
                borderColor: t.primaryContainer,
                shadowColor: t.primaryContainer,
                shadowOpacity: 0.3,
                shadowOffset: { width: 0, height: 0 },
                shadowRadius: 15,
              }}
            >
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  className="w-full h-full"
                />
              ) : (
                <View 
                  className="flex-1 items-center justify-center" 
                  style={{ backgroundColor: t.surfaceContainerHigh }}
                >
                  <Text 
                    className="text-[36px] font-extrabold" 
                    style={{ color: t.primaryContainer }}
                  >
                    {athleteName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-[22px] font-bold text-white text-center">{athleteName}</Text>
            <Text className="text-[11px] font-bold tracking-[2px] uppercase text-center" style={{ color: t.primaryContainer }}>ELITE ATHLETE</Text>
          </View>

          {/* Stats grid (2x2) */}
          <View className="flex-1 gap-4 min-w-[140px]">
            <View 
              className="flex-1 rounded-xl p-5 justify-center min-h-[90px] border border-transparent"
              style={{ backgroundColor: '#1E1E1E' }}
            >
              <Text className="text-sm leading-5 mb-1.5" style={{ color: t.onSurfaceVariant }}>Current Level</Text>
              <View className="flex-row items-end gap-2">
                <Text className="text-[48px] font-bold leading-[52px] text-white">1</Text>
                <Text className="text-[12px] font-bold tracking-widest uppercase mb-1.5" style={{ color: t.secondary }}>ROOKIE</Text>
              </View>
            </View>
            <View 
              className="flex-1 rounded-xl p-5 justify-center min-h-[90px] border border-transparent"
              style={{ backgroundColor: '#1E1E1E' }}
            >
              <Text className="text-sm leading-5 mb-1.5" style={{ color: t.onSurfaceVariant }}>Total Workouts</Text>
              <View className="flex-row items-end gap-2">
                <Text className="text-[48px] font-bold leading-[52px] text-white">0</Text>
                <Text className="text-[12px] font-bold tracking-widest uppercase mb-1.5" style={{ color: t.secondary }}>SESSIONS</Text>
              </View>
            </View>
            {/* Active Streak — full width */}
            <View
              className="rounded-xl p-5 justify-center min-h-[90px] border overflow-hidden relative"
              style={{
                backgroundColor: t.surfaceContainer,
                borderColor: `${t.primaryContainer}44`,
              }}
            >
              <Text className="text-sm leading-5 mb-1.5" style={{ color: t.onSurfaceVariant }}>Active Streak</Text>
              <View className="flex-row items-end gap-2">
                <Text
                  className="text-[48px] font-bold leading-[52px]"
                  style={{
                    color: t.primaryContainer,
                    textShadowColor: t.glowPrimary,
                    textShadowOffset: { width: 0, height: 0 },
                    textShadowRadius: 8,
                  }}
                >
                  0
                </Text>
                <Text className="text-[12px] font-bold tracking-widest uppercase mb-1.5 text-white">DAYS</Text>
              </View>
              {/* Decorative fire icon */}
              <Text className="absolute -bottom-2.5 -right-2.5 text-[80px] opacity-10">◆</Text>
            </View>
          </View>
        </View>

        {/* ── Preferences Section ── */}
        <View className="gap-4">
          <Text 
            className="text-lg font-medium uppercase tracking-widest pl-2 border-l-2"
            style={{ color: t.onSurfaceVariant, borderLeftColor: t.primaryContainer }}
          >
            Preferences
          </Text>
          <View className="rounded-xl overflow-hidden" style={{ backgroundColor: t.surfaceContainer }}>
            {/* Theme Setting */}
            <TouchableOpacity
              className="flex-row items-center justify-between p-6 min-h-[72px]"
              activeOpacity={0.7}
              onPress={() => setThemeModalVisible(true)}
            >
              <View className="flex-row items-center gap-4">
                <Text className="text-xl" style={{ color: t.onSurfaceVariant }}>🎨</Text>
                <View className="gap-0.5">
                  <Text className="text-lg font-medium text-white">Theme</Text>
                  <Text className="text-sm leading-5" style={{ color: t.onSurfaceVariant }}>
                    {THEMES[themeId].label}
                  </Text>
                </View>
              </View>
              <Text className="text-2xl" style={{ color: t.onSurfaceVariant }}>›</Text>
            </TouchableOpacity>

            <View className="h-[1px]" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />

            {/* Language */}
            <TouchableOpacity className="flex-row items-center justify-between p-6 min-h-[72px]" activeOpacity={0.7}>
              <View className="flex-row items-center gap-4">
                <Text className="text-xl" style={{ color: t.onSurfaceVariant }}>🌐</Text>
                <View className="gap-0.5">
                  <Text className="text-lg font-medium text-white">Language</Text>
                  <Text className="text-sm leading-5" style={{ color: t.onSurfaceVariant }}>
                    English (US)
                  </Text>
                </View>
              </View>
              <Text className="text-2xl" style={{ color: t.onSurfaceVariant }}>›</Text>
            </TouchableOpacity>

            <View className="h-[1px]" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />

            {/* Units */}
            <TouchableOpacity className="flex-row items-center justify-between p-6 min-h-[72px]" activeOpacity={0.7}>
              <View className="flex-row items-center gap-4">
                <Text className="text-xl" style={{ color: t.onSurfaceVariant }}>⚖️</Text>
                <View className="gap-0.5">
                  <Text className="text-lg font-medium text-white">Units</Text>
                  <Text className="text-sm leading-5" style={{ color: t.onSurfaceVariant }}>
                    Imperial (lbs, miles)
                  </Text>
                </View>
              </View>
              <Text className="text-2xl" style={{ color: t.onSurfaceVariant }}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Danger Zone ── */}
        <View className="items-center mt-3">
          <TouchableOpacity
            className="flex-row items-center gap-2 px-8 py-4 rounded border-2 min-h-[48px]"
            style={{ borderColor: 'rgba(255, 68, 68, 0.3)' }}
            activeOpacity={0.8}
            onPress={signOut}
          >
            <Text className="text-base" style={{ color: '#ef4444' }}>⎋</Text>
            <Text className="text-[12px] font-bold tracking-[2px] uppercase" style={{ color: '#ef4444' }}>LOGOUT</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Theme Selector Modal ── */}
      <Modal
        visible={themeModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setThemeModalVisible(false)}
      >
        <TouchableOpacity
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(0,0,0,0.72)' }}
          activeOpacity={1}
          onPress={() => setThemeModalVisible(false)}
        >
          <View
            className="rounded-t-[20px] border-t p-6 pb-12 gap-3"
            style={{ backgroundColor: t.surfaceContainerLow, borderColor: t.surfaceVariant }}
            // Prevent closing when tapping the sheet itself
            onStartShouldSetResponder={() => true}
          >
            <Text className="text-[22px] font-bold mb-1 text-white">Select Theme</Text>
            <Text className="text-sm mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Theme applies across the entire app
            </Text>

            {/* Theme options */}
            {(Object.keys(THEMES) as ThemeId[]).map((id) => {
              const theme = THEMES[id];
              const isActive = themeId === id;
              return (
                <TouchableOpacity
                  key={id}
                  className="flex-row items-center rounded-xl border p-4 gap-4 min-h-[64px]"
                  style={{
                    backgroundColor: isActive
                      ? `${theme.tokens.primaryContainer}18`
                      : 'rgba(255,255,255,0.04)',
                    borderColor: isActive
                      ? theme.tokens.primaryContainer
                      : 'rgba(255,255,255,0.1)',
                  }}
                  activeOpacity={0.8}
                  onPress={() => {
                    setTheme(id);
                    setThemeModalVisible(false);
                  }}
                >
                  {/* Color swatch */}
                  <View
                    className="w-9 h-9 rounded-full flex-shrink-0"
                    style={{ backgroundColor: theme.tokens.primaryContainer }}
                  />
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-white">{theme.label}</Text>
                    {isActive && (
                      <Text className="text-[12px] font-bold tracking-widest uppercase" style={{ color: theme.tokens.primaryContainer }}>
                        Active
                      </Text>
                    )}
                  </View>
                  {isActive && (
                    <Text className="text-xl font-bold" style={{ color: theme.tokens.primaryContainer }}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              className="h-12 border rounded-lg items-center justify-center mt-2"
              style={{ borderColor: 'rgba(255,255,255,0.1)' }}
              onPress={() => setThemeModalVisible(false)}
            >
              <Text className="text-[12px] font-bold tracking-[2px] uppercase" style={{ color: 'rgba(255,255,255,0.5)' }}>
                CANCEL
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
