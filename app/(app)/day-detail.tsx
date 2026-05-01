/**
 * Day Detail Screen — Stitch-faithful "Daily Protocol" layout:
 *   1. TopAppBar (sticky)
 *   2. Hero: DAY NAME (display-xl) + Date meta
 *   3. Assignment Area: 
 *      - If routine: Protocol Card with stats + START/CLEAR CTAs
 *      - If rest: Subdued "Rest & Recovery" hero + ASSIGN primary CTA
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppTopBar } from '@/components/ui/AppTopBar';
import { LoadingScreen } from '@/components/ui';
import { useTheme } from '@/lib/hooks/useTheme';
import { useWeekSchedule, useCurrentProfile, useClearScheduleDay } from '@/lib/hooks';
import type { DayOfWeek, RoutineWithExercises } from '@/types';

const DAY_LABELS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

export default function DayDetailScreen() {
  const { day } = useLocalSearchParams<{ day: string }>();
  const router = useRouter();
  const t = useTheme();
  const { data: profile } = useCurrentProfile();
  const { data: schedule, isLoading } = useWeekSchedule(profile?.id);
  const clearDay = useClearScheduleDay(profile?.id);

  if (isLoading || !profile) return <LoadingScreen />;

  const dayIndex = parseInt(day ?? '0', 10) as DayOfWeek;
  const dayName = DAY_LABELS[dayIndex];
  const routineForDay = schedule?.find((s) => s.day_of_week === dayIndex)?.routine as RoutineWithExercises | undefined;

  const handleClearDay = async () => {
    Alert.alert(
      'Clear Protocol',
      `Remove ${routineForDay?.name} from ${dayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            try {
              await clearDay.mutateAsync(dayIndex);
              router.back();
            } catch (e) {
              console.error(e);
            }
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.background }]} edges={['top']}>
      <AppTopBar />
      <View style={[styles.container, { backgroundColor: t.background }]}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* ── 1. Hero Area ── */}
          <View style={styles.hero}>
            <View style={[styles.heroBadge, { backgroundColor: `${t.primaryContainer}22`, borderColor: `${t.primaryContainer}44` }]}>
              <Text style={[styles.heroBadgeText, { color: t.primaryContainer }]}>DAILY PROTOCOL</Text>
            </View>
            <Text style={[styles.dayTitle, { color: t.onSurface }]}>{dayName}</Text>
          </View>

          {/* ── 2. Protocol Assignment ── */}
          {routineForDay ? (
            <View style={styles.protocolArea}>
              <View style={[styles.protocolCard, { backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest }]}>
                <Text style={[styles.protocolLabel, { color: t.outline }]}>ASSIGNED ROUTINE</Text>
                <Text style={[styles.protocolName, { color: t.onSurface }]}>{routineForDay.name.toUpperCase()}</Text>
                
                <View style={styles.statsRow}>
                  <View style={styles.stat}>
                    <Text style={[styles.statValue, { color: t.onSurface }]}>{routineForDay.exercises?.length ?? 0}</Text>
                    <Text style={[styles.statLabel, { color: t.onSurfaceVariant }]}>MOVEMENTS</Text>
                  </View>
                  <View style={[styles.statDivider, { backgroundColor: t.surfaceContainerHighest }]} />
                  <View style={styles.stat}>
                    <Text style={[styles.statValue, { color: t.onSurface }]}>45m</Text>
                    <Text style={[styles.statLabel, { color: t.onSurfaceVariant }]}>EST. TIME</Text>
                  </View>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[styles.primaryBtn, { backgroundColor: t.primaryContainer, shadowColor: t.primaryContainer }]}
                    onPress={() => router.push({ pathname: '/workout', params: { id: routineForDay.id } })}
                  >
                    <Text style={[styles.primaryBtnText, { color: '#000' }]}>VIEW & START</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.clearBtn, { borderColor: t.surfaceContainerHighest }]}
                    onPress={handleClearDay}
                  >
                    <Text style={[styles.clearBtnText, { color: t.error || '#ff4444' }]}>CLEAR FROM SCHEDULE</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.restArea}>
              <View style={styles.restIconWrapper}>
                <Text style={styles.restIcon}>💤</Text>
              </View>
              <Text style={[styles.restTitle, { color: t.onSurface }]}>REST & RECOVERY</Text>
              <Text style={[styles.restSubtitle, { color: t.onSurfaceVariant }]}>
                No training protocol assigned for this period. Rest is essential for peak performance.
              </Text>

              <View style={styles.restActions}>
                <TouchableOpacity
                  style={[styles.primaryBtn, { backgroundColor: t.primaryContainer, shadowColor: t.primaryContainer }]}
                  onPress={() => router.push('/routines')}
                >
                  <Text style={[styles.primaryBtnText, { color: '#000' }]}>ASSIGN ROUTINE</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.secondaryBtn, { borderColor: t.surfaceContainerHighest }]}
                  onPress={() => router.push('/routine-builder')}
                >
                  <Text style={[styles.secondaryBtnText, { color: t.onSurface }]}>BUILD NEW PROTOCOL</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { paddingBottom: 40 },
  hero: {
    paddingHorizontal: 24,
    paddingTop: 32,
    gap: 12,
  },
  heroBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
  },
  dayTitle: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
  },
  protocolArea: {
    padding: 20,
    marginTop: 24,
  },
  protocolCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    gap: 20,
  },
  protocolLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 2,
  },
  protocolName: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  cardActions: {
    gap: 12,
    marginTop: 12,
  },
  primaryBtn: {
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  clearBtn: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
  },
  // Rest Area
  restArea: {
    flex: 1,
    padding: 32,
    alignItems: 'center',
    gap: 16,
    marginTop: 40,
  },
  restIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  restIcon: { fontSize: 48 },
  restTitle: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  restSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  restActions: {
    width: '100%',
    gap: 12,
  },
  secondaryBtn: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
  },
});
