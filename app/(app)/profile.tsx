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
  StyleSheet,
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.background }]} edges={['top']}>
      <AppTopBar />
      <ScrollView
        style={[styles.scroll, { backgroundColor: t.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile Header Bento ── */}
        <View style={styles.profileHeaderBento}>
          {/* Avatar card */}
          <View style={[styles.avatarCard, { backgroundColor: t.surfaceContainer }]}>
            <View
              style={[
                styles.avatarRing,
                {
                  borderColor: t.primaryContainer,
                  shadowColor: t.primaryContainer,
                },
              ]}
            >
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: t.surfaceContainerHigh }]}>
                  <Text style={[styles.avatarInitial, { color: t.primaryContainer }]}>
                    {athleteName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.profileName}>{athleteName}</Text>
            <Text style={[styles.profileRank, { color: t.primaryContainer }]}>ELITE ATHLETE</Text>
          </View>

          {/* Stats grid (2x2) */}
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#1E1E1E' }]}>
              <Text style={[styles.statLabel, { color: t.onSurfaceVariant }]}>Current Level</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statBigNum}>1</Text>
                <Text style={[styles.statUnit, { color: t.secondary }]}>ROOKIE</Text>
              </View>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#1E1E1E' }]}>
              <Text style={[styles.statLabel, { color: t.onSurfaceVariant }]}>Total Workouts</Text>
              <View style={styles.statValueRow}>
                <Text style={styles.statBigNum}>0</Text>
                <Text style={[styles.statUnit, { color: t.secondary }]}>SESSIONS</Text>
              </View>
            </View>
            {/* Active Streak — full width */}
            <View
              style={[
                styles.statCardWide,
                {
                  backgroundColor: t.surfaceContainer,
                  borderColor: `${t.primaryContainer}44`,
                },
              ]}
            >
              <Text style={[styles.statLabel, { color: t.onSurfaceVariant }]}>Active Streak</Text>
              <View style={styles.statValueRow}>
                <Text
                  style={[
                    styles.statBigNum,
                    {
                      color: t.primaryContainer,
                      textShadowColor: t.glowPrimary,
                      textShadowOffset: { width: 0, height: 0 },
                      textShadowRadius: 8,
                    },
                  ]}
                >
                  0
                </Text>
                <Text style={styles.statUnitWhite}>DAYS</Text>
              </View>
              {/* Decorative fire icon */}
              <Text style={styles.fireIcon}>◆</Text>
            </View>
          </View>
        </View>

        {/* ── Preferences Section ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: t.onSurfaceVariant, borderLeftColor: t.primaryContainer }]}>
            Preferences
          </Text>
          <View style={[styles.settingsCard, { backgroundColor: t.surfaceContainer }]}>
            {/* Theme Setting */}
            <TouchableOpacity
              style={styles.settingsRow}
              activeOpacity={0.7}
              onPress={() => setThemeModalVisible(true)}
            >
              <View style={styles.settingsRowLeft}>
                <Text style={[styles.settingsIcon, { color: t.onSurfaceVariant }]}>🎨</Text>
                <View style={styles.settingsRowInfo}>
                  <Text style={styles.settingsRowTitle}>Theme</Text>
                  <Text style={[styles.settingsRowValue, { color: t.onSurfaceVariant }]}>
                    {THEMES[themeId].label}
                  </Text>
                </View>
              </View>
              <Text style={[styles.chevron, { color: t.onSurfaceVariant }]}>›</Text>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />

            {/* Language */}
            <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
              <View style={styles.settingsRowLeft}>
                <Text style={[styles.settingsIcon, { color: t.onSurfaceVariant }]}>🌐</Text>
                <View style={styles.settingsRowInfo}>
                  <Text style={styles.settingsRowTitle}>Language</Text>
                  <Text style={[styles.settingsRowValue, { color: t.onSurfaceVariant }]}>
                    English (US)
                  </Text>
                </View>
              </View>
              <Text style={[styles.chevron, { color: t.onSurfaceVariant }]}>›</Text>
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: 'rgba(255,255,255,0.05)' }]} />

            {/* Units */}
            <TouchableOpacity style={styles.settingsRow} activeOpacity={0.7}>
              <View style={styles.settingsRowLeft}>
                <Text style={[styles.settingsIcon, { color: t.onSurfaceVariant }]}>⚖️</Text>
                <View style={styles.settingsRowInfo}>
                  <Text style={styles.settingsRowTitle}>Units</Text>
                  <Text style={[styles.settingsRowValue, { color: t.onSurfaceVariant }]}>
                    Imperial (lbs, miles)
                  </Text>
                </View>
              </View>
              <Text style={[styles.chevron, { color: t.onSurfaceVariant }]}>›</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Danger Zone ── */}
        <View style={styles.dangerZone}>
          <TouchableOpacity
            style={[styles.logoutButton, { borderColor: 'rgba(255, 68, 68, 0.3)' }]}
            activeOpacity={0.8}
            onPress={signOut}
          >
            <Text style={styles.logoutIcon}>⎋</Text>
            <Text style={styles.logoutText}>LOGOUT</Text>
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
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setThemeModalVisible(false)}
        >
          <View
            style={[styles.modalSheet, { backgroundColor: t.surfaceContainerLow, borderColor: t.surfaceVariant }]}
            // Prevent closing when tapping the sheet itself
            onStartShouldSetResponder={() => true}
          >
            <Text style={[styles.modalTitle, { color: '#fff' }]}>Select Theme</Text>
            <Text style={[styles.modalSubtitle, { color: 'rgba(255,255,255,0.5)' }]}>
              Theme applies across the entire app
            </Text>

            {/* Theme options */}
            {(Object.keys(THEMES) as ThemeId[]).map((id) => {
              const theme = THEMES[id];
              const isActive = themeId === id;
              return (
                <TouchableOpacity
                  key={id}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: isActive
                        ? `${theme.tokens.primaryContainer}18`
                        : 'rgba(255,255,255,0.04)',
                      borderColor: isActive
                        ? theme.tokens.primaryContainer
                        : 'rgba(255,255,255,0.1)',
                    },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    setTheme(id);
                    setThemeModalVisible(false);
                  }}
                >
                  {/* Color swatch */}
                  <View
                    style={[
                      styles.themeSwatch,
                      { backgroundColor: theme.tokens.primaryContainer },
                    ]}
                  />
                  <View style={styles.themeOptionInfo}>
                    <Text style={styles.themeOptionLabel}>{theme.label}</Text>
                    {isActive && (
                      <Text style={[styles.themeOptionActive, { color: theme.tokens.primaryContainer }]}>
                        Active
                      </Text>
                    )}
                  </View>
                  {isActive && (
                    <Text style={[styles.themeCheck, { color: theme.tokens.primaryContainer }]}>✓</Text>
                  )}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={[styles.modalDismiss, { borderColor: 'rgba(255,255,255,0.1)' }]}
              onPress={() => setThemeModalVisible(false)}
            >
              <Text style={[styles.modalDismissText, { color: 'rgba(255,255,255,0.5)' }]}>
                CANCEL
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingTop: 16,
    paddingHorizontal: 24,
    paddingBottom: 120,
    gap: 40,
  },
  // Profile header bento
  profileHeaderBento: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  avatarCard: {
    flex: 1,
    minWidth: 140,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 200,
    gap: 12,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 99,
    borderWidth: 2,
    overflow: 'hidden',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 15,
    elevation: 8,
  },
  avatarImage: { width: '100%', height: '100%' },
  avatarPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: '800',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  profileRank: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  // Stats grid
  statsGrid: {
    flex: 1,
    gap: 16,
    minWidth: 140,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 20,
    justifyContent: 'center',
    minHeight: 90,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statCardWide: {
    borderRadius: 12,
    padding: 20,
    justifyContent: 'center',
    minHeight: 90,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  statLabel: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 6,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  statBigNum: {
    fontSize: 48,
    fontWeight: '700',
    lineHeight: 52,
    color: '#fff',
  },
  statUnit: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  statUnitWhite: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 6,
    color: '#fff',
  },
  fireIcon: {
    position: 'absolute',
    bottom: -10,
    right: -10,
    fontSize: 80,
    opacity: 0.1,
  },
  // Settings
  section: { gap: 16 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 2,
    paddingLeft: 8,
    borderLeftWidth: 2,
  },
  settingsCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    minHeight: 72,
  },
  settingsRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  settingsIcon: { fontSize: 20 },
  settingsRowInfo: { gap: 2 },
  settingsRowTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#fff',
  },
  settingsRowValue: {
    fontSize: 14,
    lineHeight: 20,
  },
  chevron: { fontSize: 24 },
  divider: { height: 1, marginHorizontal: 0 },
  // Danger zone
  dangerZone: {
    alignItems: 'center',
    marginTop: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 4,
    borderWidth: 2,
    minHeight: 48,
  },
  logoutIcon: { fontSize: 16, color: '#ef4444' },
  logoutText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: '#ef4444',
  },
  // Theme modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    padding: 24,
    paddingBottom: 48,
    gap: 12,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 16,
    gap: 16,
    minHeight: 64,
  },
  themeSwatch: {
    width: 36,
    height: 36,
    borderRadius: 99,
    flexShrink: 0,
  },
  themeOptionInfo: { flex: 1 },
  themeOptionLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  themeOptionActive: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  themeCheck: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalDismiss: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  modalDismissText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
