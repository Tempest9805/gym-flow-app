/**
 * Home Screen — Implements Stitch `home_canonical_purple` layout exactly:
 *   1. TopAppBar (fixed)
 *   2. Greeting ("HELLO, ATHLETE")
 *   3. Weekly tracker (Mon-Sun checks)
 *   4. Today's Routine (clear format, sets/reps helper, completion toggle)
 *   5. Minimal stats bento & Agenda preview
 */
import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  AccessibilityRole,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RoutineWithExercises } from '@/types';
import { useRouter } from 'expo-router';
import { AppTopBar } from '@/components/ui/AppTopBar';
import { useTheme } from '@/lib/hooks/useTheme';
import { useCurrentProfile, useWeekSchedule } from '@/lib/hooks';
import { useSessionStore } from '@/lib/store/sessionStore';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getWeekStart(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  // We align with Javascript's getDay() where 0 is Sunday
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().split('T')[0];
}

export default function HomeScreen() {
  const router = useRouter();
  const t = useTheme();
  const { data: profile, isLoading: profileLoading } = useCurrentProfile();
  const { data: schedule, isLoading: scheduleLoading } = useWeekSchedule(profile?.id);

  const { completedExercises, completedDays, toggleExercise, toggleDay, checkAndResetWeekly } = useSessionStore();

  const today = useMemo(() => new Date(), []);
  const todayIndex = today.getDay();
  const currentWeekStart = useMemo(() => getWeekStart(today), [today]);

  useEffect(() => {
    const timer = setTimeout(() => {
      checkAndResetWeekly(currentWeekStart);
    }, 100);
    return () => clearTimeout(timer);
  }, [checkAndResetWeekly, currentWeekStart]);

  const handleToggleExercise = React.useCallback((id: string) => {
    toggleExercise(id);
  }, [toggleExercise]);

  const handleToggleDay = React.useCallback((index: number) => {
    toggleDay(index, currentWeekStart);
  }, [toggleDay, currentWeekStart]);

  const handleNavigateToExercise = React.useCallback((exerciseId: string) => {
    router.push(`/exercise/${exerciseId}`);
  }, [router]);

  const todaysEntry = schedule?.find((s) => s.day_of_week === todayIndex);
  // Cast to RoutineWithExercises — the API may return exercises joined
  const todaysRoutine = todaysEntry?.routine as RoutineWithExercises | undefined;

  // Next 2 upcoming days with routines
  const upcomingDays = schedule
    ?.filter((s) => s.day_of_week !== todayIndex && s.routine)
    .slice(0, 2) ?? [];

  const athleteName = profile?.full_name?.split(' ')[0]?.toUpperCase() || 'ATHLETE';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.background }]} edges={['top']}>
      <AppTopBar />
      <ScrollView
        style={[styles.scroll, { backgroundColor: t.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. Greeting ── */}
        <View style={styles.greetingSection}>
          <Text style={[styles.greetingMain, { color: t.onBackground }]}>
            HELLO,{'\n'}
            <Text style={[styles.greetingName, { color: t.outlineVariant }]}>
              {profileLoading ? '...' : athleteName}
            </Text>
          </Text>
        </View>

        {/* ── 2. Weekly Tracker ── */}
        <View style={styles.weeklyTrackerContainer}>
          {DAY_NAMES.map((dayName, index) => {
            const isCompleted = completedDays[index];
            const isToday = index === todayIndex;
            return (
              <TouchableOpacity
                key={index}
                onPress={() => handleToggleDay(index)}
                accessibilityRole="button"
                accessibilityLabel={`${isCompleted ? 'Marked as completed' : 'Mark as completed'} for ${dayName}`}
                accessibilityState={{ checked: isCompleted }}
                style={[
                  styles.dayBadge,
                  isToday && { borderColor: t.primaryContainer, borderWidth: 1 },
                  isCompleted ? { backgroundColor: t.primaryContainer } : { backgroundColor: t.surfaceContainer },
                ]}
              >
                <Text
                  style={[
                    styles.dayName,
                    isCompleted ? { color: t.onPrimaryContainer } : { color: t.onSurfaceVariant },
                  ]}
                >
                  {dayName.slice(0, 2)}
                </Text>
                <Text style={[styles.dayIcon, isCompleted ? { color: t.onPrimaryContainer } : { color: t.outlineVariant }]}>
                  {isCompleted ? '✓' : '✕'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── 3. Today's Routine ── */}
        {todaysRoutine ? (
          <View style={styles.routineSection}>
            <View style={styles.routineHeader}>
              <Text style={[styles.routineTitle, { color: t.onBackground }]}>
                {todaysRoutine.name.toUpperCase()}
              </Text>
              
              <View style={[styles.helperBox, { backgroundColor: t.surfaceContainerLow, borderColor: t.surfaceContainerHighest }]}>
                <Text style={[styles.helperText, { color: t.onSurfaceVariant }]}>
                  <Text style={{ fontWeight: 'bold' }}>Series</Text> = cuántas veces repites el ejercicio
                </Text>
                <Text style={[styles.helperText, { color: t.onSurfaceVariant }]}>
                  <Text style={{ fontWeight: 'bold' }}>Repeticiones</Text> = cuántas veces haces el movimiento en cada serie
                </Text>
              </View>
            </View>

            <View style={styles.exerciseList}>
              {todaysRoutine.exercises?.map((item, index) => {
                const isCompleted = completedExercises[item.id];
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.exerciseCard,
                      {
                        backgroundColor: t.surface,
                        borderColor: isCompleted ? t.primaryContainer : t.surfaceContainerHighest,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      style={styles.exerciseInfo}
                      onPress={() => handleNavigateToExercise(item.exercise_id)}
                      activeOpacity={0.7}
                      accessibilityRole="link"
                      accessibilityLabel={`View details for ${item.exercise?.name_en}`}
                    >
                      <Text style={[
                        styles.exerciseName, 
                        { color: t.onSurface },
                        isCompleted && { textDecorationLine: 'line-through', color: t.outline }
                      ]}>
                        {item.exercise?.name_en?.toUpperCase()}
                      </Text>
                      <Text style={[styles.exerciseMeta, { color: t.onSurfaceVariant }]}>
                        {item.sets} series x {item.reps ? `${item.reps} reps` : `${item.duration_seconds}s`}
                        {item.rest_seconds ? ` • ${item.rest_seconds}s rest` : ''}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.checkButton,
                        isCompleted 
                          ? { backgroundColor: t.primaryContainer, borderColor: t.primaryContainer }
                          : { backgroundColor: 'transparent', borderColor: t.outlineVariant }
                      ]}
                      onPress={() => handleToggleExercise(item.id)}
                      accessibilityRole="checkbox"
                      accessibilityLabel={`Mark ${item.exercise?.name_en} as completed`}
                      accessibilityState={{ checked: isCompleted }}
                    >
                      {isCompleted && <Text style={{ color: t.onPrimaryContainer, fontWeight: '800', fontSize: 16 }}>✓</Text>}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        ) : (
          <View
            style={[
              styles.nowCard,
              {
                backgroundColor: t.surface,
                borderColor: t.surfaceContainerHighest,
              },
            ]}
          >
            <View style={styles.nowCardHeader}>
              <View style={styles.nowCardHeaderLeft}>
                <Text style={[styles.nowCardLabel, { color: t.onSurfaceVariant }]}>
                  TODAY
                </Text>
                <Text style={[styles.nowCardTitle, { color: t.onBackground }]}>
                  REST DAY
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.nowCardCTA,
                {
                  backgroundColor: t.primaryContainer,
                  shadowColor: t.primaryContainer,
                },
              ]}
              activeOpacity={0.85}
              onPress={() => router.push('/exercises')}
            >
              <Text style={[styles.nowCardCTAText, { color: t.onPrimaryContainer }]}>
                BROWSE EXERCISES
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── 4. Minimal stats bento ── */}
        <View style={styles.statsGrid}>
          <View
            style={[
              styles.statCard,
              { backgroundColor: t.surface, borderColor: t.surfaceContainerHighest },
            ]}
          >
            <Text style={[styles.statCardLabel, { color: t.onSurfaceVariant }]}>▲ Weekly Load</Text>
            <Text style={[styles.statCardValue, { color: t.onBackground }]}>
              {(schedule?.filter((s) => s.routine).length ?? 0)}
              <Text style={[styles.statCardUnit, { color: t.outlineVariant }]}> days</Text>
            </Text>
          </View>
          <View
            style={[
              styles.statCard,
              { backgroundColor: t.surface, borderColor: t.surfaceContainerHighest },
            ]}
          >
            <Text style={[styles.statCardLabel, { color: t.onSurfaceVariant }]}>♥ Recovery</Text>
            <Text style={[styles.statCardValue, { color: t.secondary }]}>
              {todaysRoutine ? '72' : '94'}
              <Text style={[styles.statCardUnit, { color: t.outlineVariant }]}>%</Text>
            </Text>
          </View>
        </View>

        {/* ── 5. Agenda preview ── */}
        <View style={styles.agendaSection}>
          <Text style={[styles.agendaSectionTitle, { color: t.onBackground }]}>Agenda</Text>
          {scheduleLoading ? (
            <ActivityIndicator color={t.primaryContainer} style={{ marginTop: 12 }} />
          ) : upcomingDays.length === 0 ? (
            <View
              style={[
                styles.agendaEmptyCard,
                { backgroundColor: t.surface },
              ]}
            >
              <Text style={[styles.agendaEmptyText, { color: t.onSurfaceVariant }]}>
                No upcoming workouts. Create a routine to get started.
              </Text>
              <TouchableOpacity
                style={[styles.agendaEmptyButton, { borderColor: t.surfaceContainerHighest }]}
                onPress={() => router.push('/routines')}
              >
                <Text style={[styles.agendaEmptyButtonText, { color: t.primaryContainer }]}>
                  CREATE ROUTINE
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            upcomingDays.map((entry) => {
              const d = new Date();
              const diff = ((entry.day_of_week - today.getDay()) + 7) % 7;
              d.setDate(d.getDate() + diff);
              return (
                <TouchableOpacity
                  key={entry.day_of_week}
                  style={[
                    styles.agendaItem,
                    { backgroundColor: t.surface },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => router.push('/agenda')}
                >
                  <View style={[styles.agendaDateBadge, { backgroundColor: t.surfaceContainer }]}>
                    <Text style={[styles.agendaDateDay, { color: t.onSurfaceVariant }]}>
                      {DAY_NAMES[entry.day_of_week].toUpperCase()}
                    </Text>
                    <Text style={[styles.agendaDateNum, { color: t.onBackground }]}>
                      {d.getDate()}
                    </Text>
                  </View>
                  <View style={styles.agendaItemInfo}>
                    <Text style={[styles.agendaItemName, { color: t.onBackground }]}>
                      {entry.routine?.name?.toUpperCase()}
                    </Text>
                    <Text style={[styles.agendaItemMeta, { color: t.onSurfaceVariant }]}>
                      {Math.max(30, ((entry.routine as RoutineWithExercises)?.exercises?.length ?? 4) * 8)}m • Strength
                    </Text>
                  </View>
                  <Text style={[styles.agendaChevron, { color: t.outlineVariant }]}>›</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingTop: 16,
    paddingBottom: 120,
    paddingHorizontal: 20,
    gap: 32,
  },
  // Greeting
  greetingSection: {},
  greetingMain: {
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 52,
    letterSpacing: -1,
    textTransform: 'uppercase',
  },
  greetingName: {
    fontSize: 48,
    fontWeight: '800',
    lineHeight: 52,
  },
  // Weekly Tracker
  weeklyTrackerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  dayBadge: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: 'center',
    gap: 4,
  },
  dayName: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  dayIcon: {
    fontSize: 14,
    fontWeight: '800',
  },
  // Routine Section
  routineSection: {
    gap: 16,
  },
  routineHeader: {
    gap: 12,
  },
  routineTitle: {
    fontSize: 32,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: -0.5,
  },
  helperBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  helperText: {
    fontSize: 13,
    lineHeight: 18,
  },
  exerciseList: {
    gap: 12,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 16,
  },
  exerciseInfo: {
    flex: 1,
    gap: 4,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  exerciseMeta: {
    fontSize: 14,
    fontWeight: '500',
  },
  checkButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Rest Day card (fallback)
  nowCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 24,
    gap: 24,
  },
  nowCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  nowCardHeaderLeft: { gap: 8 },
  nowCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  nowCardTitle: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: -0.5,
    textTransform: 'uppercase',
  },
  nowCardCTA: {
    height: 64,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 16,
    elevation: 8,
  },
  nowCardCTAText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  // Stats bento
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    gap: 8,
  },
  statCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statCardValue: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 36,
  },
  statCardUnit: {
    fontSize: 20,
    fontWeight: '400',
  },
  // Agenda
  agendaSection: { gap: 16 },
  agendaSectionTitle: {
    fontSize: 24,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  agendaItem: {
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  agendaDateBadge: {
    width: 48,
    height: 48,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agendaDateDay: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  agendaDateNum: {
    fontSize: 16,
    fontWeight: '700',
  },
  agendaItemInfo: { flex: 1 },
  agendaItemName: {
    fontSize: 18,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  agendaItemMeta: {
    fontSize: 14,
    marginTop: 2,
  },
  agendaChevron: {
    fontSize: 22,
  },
  agendaEmptyCard: {
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    gap: 16,
  },
  agendaEmptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  agendaEmptyButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  agendaEmptyButtonText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});