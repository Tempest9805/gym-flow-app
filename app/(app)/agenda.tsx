/**
 * Agenda Screen — Stitch `weekly_agenda_canonical_purple` layout:
 *   1. TopAppBar
 *   2. "SYNCED" badge + "AGENDA" header + week subtitle
 *   3. 7-day vertical flow:
 *      - Done days: muted, strikethrough, ✓ DONE badge
 *      - Today: highlighted card with neon border + START WORKOUT CTA
 *      - Upcoming: subdued cards with "UPCOMING" label
 *      - Rest day: snooze icon
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppTopBar } from '@/components/ui/AppTopBar';
import { useTheme } from '@/lib/hooks/useTheme';
import { useCurrentProfile, useWeekSchedule } from '@/lib/hooks';
import type { WorkoutScheduleWithRoutine, RoutineWithExercises } from '@/types';

const DAY_NAMES_SHORT = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const MONTH_NAMES_SHORT = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

const ORDERED_DAYS = [1, 2, 3, 4, 5, 6, 0]; // Mon..Sun display order

export default function AgendaScreen() {
  const router = useRouter();
  const t = useTheme();
  const { data: profile } = useCurrentProfile();
  const { data: schedule, isLoading } = useWeekSchedule(profile?.id);

  const today = new Date();
  const todayIndex = today.getDay(); // 0 = Sun

  // Build a map from day_of_week → schedule entry
  const scheduleMap: Record<number, WorkoutScheduleWithRoutine | undefined> = {};
  schedule?.forEach((s) => {
    scheduleMap[s.day_of_week] = s;
  });

  // Compute week date for each day (relative to today)
  function getDateForDay(dayIndex: number): Date {
    const d = new Date(today);
    const diff = ((dayIndex - todayIndex) + 7) % 7;
    d.setDate(today.getDate() + diff);
    return d;
  }

  const weekNum = Math.ceil(today.getDate() / 7);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: t.background }]} edges={['top']}>
      <AppTopBar />
      <ScrollView
        style={[styles.scroll, { backgroundColor: t.background }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.headerSection}>
          <View
            style={[
              styles.syncBadge,
              {
                backgroundColor: `${t.primaryContainer}22`,
                borderColor: `${t.primaryContainer}44`,
              },
            ]}
          >
            <Text style={[styles.syncBadgeText, { color: t.primaryContainer }]}>
              ↻  SYNCED TO CLOUD
            </Text>
          </View>
          <Text style={[styles.pageTitle, { color: t.onSurface }]}>AGENDA</Text>
          <Text style={[styles.pageSubtitle, { color: t.onSurfaceVariant }]}>
            Week {weekNum} • Training Phase
          </Text>
        </View>

        {/* ── 7-Day vertical flow ── */}
        {isLoading ? (
          <ActivityIndicator color={t.primaryContainer} style={{ marginTop: 24 }} />
        ) : (
          <View style={styles.daysContainer}>
            {ORDERED_DAYS.map((dayIndex) => {
              const entry = scheduleMap[dayIndex];
              const date = getDateForDay(dayIndex);
              const isToday = dayIndex === todayIndex;
              const isPast = !isToday && ((dayIndex - todayIndex + 7) % 7) > 3 || (dayIndex < todayIndex && !isToday);
              // Simpler approach: days before today in the week = done
              const dayDiff = ((dayIndex - todayIndex) + 7) % 7;
              const isDone = dayDiff !== 0 && dayDiff >= 4; // days 4-6 relative positions = past (Mon-today wrap)
              const isUpcoming = !isToday && dayDiff > 0 && dayDiff <= 3;
              const isRestDay = !entry?.routine;

              const dateLabel = `${DAY_NAMES_SHORT[dayIndex]} • ${MONTH_NAMES_SHORT[date.getMonth()]} ${date.getDate()}`;

              if (isToday) {
                return (
                  <View
                    key={dayIndex}
                    style={[
                      styles.todayCard,
                      {
                        backgroundColor: t.surfaceContainerHighest,
                        borderColor: t.primaryContainer,
                        shadowColor: t.primaryContainer,
                      },
                    ]}
                  >
                    {/* Decorative glow */}
                    <View
                      style={[
                        styles.todayGlow,
                        { backgroundColor: `${t.primaryContainer}22` },
                      ]}
                    />
                    <View style={styles.todayContent}>
                      <View style={styles.todayTopRow}>
                        <View
                          style={[
                            styles.todayDateBadge,
                            { backgroundColor: `${t.primaryContainer}18` },
                          ]}
                        >
                          <Text style={[styles.todayDateText, { color: t.primaryContainer }]}>
                            {DAY_NAMES_SHORT[dayIndex]} • TODAY
                          </Text>
                        </View>
                        <Text style={[styles.todayBoltIcon, { color: t.primaryContainer }]}>⚡</Text>
                      </View>
                      <Text style={[styles.todayTitle, { color: t.onSurface }]}>
                        {entry?.routine?.name ?? 'Rest Day'}
                      </Text>
                      {entry?.routine && (
                        <View style={styles.todayMeta}>
                          <View style={styles.todayMetaItem}>
                            <Text style={[styles.todayMetaIcon, { color: t.onSurfaceVariant }]}>⏱</Text>
                            <Text style={[styles.todayMetaText, { color: t.onSurfaceVariant }]}>
                              {Math.max(30, ((entry?.routine as RoutineWithExercises)?.exercises?.length ?? 4) * 8)} Min
                            </Text>
                          </View>
                          <View style={styles.todayMetaItem}>
                            <Text style={[styles.todayMetaIcon, { color: t.onSurfaceVariant }]}>🔥</Text>
                            <Text style={[styles.todayMetaText, { color: t.onSurfaceVariant }]}>
                              High Intensity
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                    {/* Primary CTA */}
                    <TouchableOpacity
                      style={[
                        styles.todayCTA,
                        {
                          backgroundColor: t.primaryContainer,
                          borderTopColor: `${t.primaryContainer}88`,
                        },
                      ]}
                      activeOpacity={0.85}
                      onPress={() =>
                        entry?.routine
                          ? router.push({ pathname: '/workout', params: { id: entry.routine.id } })
                          : router.push('/exercises')
                      }
                    >
                      <Text style={[styles.todayCTAText, { color: '#000' }]}>
                        {entry?.routine ? 'START WORKOUT  ▶' : 'BROWSE EXERCISES'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              }

              // Done / Upcoming / Rest
              return (
                <TouchableOpacity
                  key={dayIndex}
                  activeOpacity={isDone ? 1 : 0.8}
                  onPress={() =>
                    !isDone && entry?.routine
                      ? router.push({ pathname: '/workout', params: { id: entry.routine.id } })
                      : undefined
                  }
                  style={[
                    styles.dayCard,
                    {
                      backgroundColor: isDone ? t.surfaceContainerLow : t.surfaceContainer,
                      borderColor: t.surfaceContainerHighest,
                      opacity: isDone ? 0.5 : isRestDay && isUpcoming ? 0.7 : 1,
                    },
                  ]}
                >
                  <View style={styles.dayCardInfo}>
                    <Text style={[styles.dayCardDate, { color: t.onSurfaceVariant }]}>
                      {dateLabel}
                    </Text>
                    <Text
                      style={[
                        styles.dayCardName,
                        { color: t.onSurface },
                        isDone && styles.strikethrough,
                      ]}
                    >
                      {entry?.routine?.name ?? 'Rest Day'}
                    </Text>
                  </View>
                  {isDone ? (
                    <View style={[styles.doneBadge, { backgroundColor: t.surface }]}>
                      <Text style={[styles.doneBadgeText, { color: t.onSurfaceVariant }]}>✓ DONE</Text>
                    </View>
                  ) : isRestDay ? (
                    <Text style={[styles.snoozeIcon, { color: t.outline }]}>💤</Text>
                  ) : (
                    <Text style={[styles.upcomingLabel, { color: t.outline }]}>UPCOMING</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scroll: { flex: 1 },
  content: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 24,
  },
  // Header
  headerSection: { gap: 8 },
  syncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  syncBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  pageTitle: {
    fontSize: 48,
    fontWeight: '800',
    letterSpacing: -1,
    lineHeight: 52,
  },
  pageSubtitle: {
    fontSize: 16,
    lineHeight: 24,
  },
  // Days
  daysContainer: { gap: 8 },
  dayCard: {
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
  },
  dayCardInfo: { gap: 4 },
  dayCardDate: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  dayCardName: {
    fontSize: 24,
    fontWeight: '600',
  },
  strikethrough: {
    textDecorationLine: 'line-through',
  },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 8,
  },
  doneBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  upcomingLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  snoozeIcon: { fontSize: 20 },
  // Today card
  todayCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 8,
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 15,
    elevation: 8,
  },
  todayGlow: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 128,
    height: 128,
    borderRadius: 99,
  },
  todayContent: {
    padding: 16,
    gap: 12,
  },
  todayTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  todayDateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  todayDateText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  todayBoltIcon: { fontSize: 18 },
  todayTitle: {
    fontSize: 32,
    fontWeight: '700',
    lineHeight: 36,
    letterSpacing: -0.5,
  },
  todayMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  todayMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  todayMetaIcon: { fontSize: 14 },
  todayMetaText: { fontSize: 14, lineHeight: 20 },
  todayCTA: {
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
  },
  todayCTAText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
});
