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
    <SafeAreaView className="flex-1" style={{ backgroundColor: t.background }} edges={['top']}>
      <AppTopBar />
      <ScrollView
        className="flex-1"
        style={{ backgroundColor: t.background }}
        contentContainerStyle={{
          paddingTop: 24,
          paddingHorizontal: 20,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View className="gap-2 mb-6">
          <View
            className="flex-row items-center gap-2 border rounded-full px-3 py-1 self-start"
            style={{
              backgroundColor: `${t.primaryContainer}22`,
              borderColor: `${t.primaryContainer}44`,
            }}
          >
            <Text className="text-[11px] font-bold tracking-[1.5px] uppercase" style={{ color: t.primaryContainer }}>
              ↻  SYNCED TO CLOUD
            </Text>
          </View>
          <Text className="text-[48px] font-extrabold tracking-tighter leading-[52px]" style={{ color: t.onSurface }}>AGENDA</Text>
          <Text className="text-base leading-6" style={{ color: t.onSurfaceVariant }}>
            Week {weekNum} • Training Phase
          </Text>
        </View>

        {/* ── 7-Day vertical flow ── */}
        {isLoading ? (
          <ActivityIndicator color={t.primaryContainer} style={{ marginTop: 24 }} />
        ) : (
          <View className="gap-2">
            {ORDERED_DAYS.map((dayIndex) => {
              const entry = scheduleMap[dayIndex];
              const date = getDateForDay(dayIndex);
              const isToday = dayIndex === todayIndex;
              // Simpler approach: days before today in the week = done
              const dayDiff = ((dayIndex - todayIndex) + 7) % 7;
              const isDone = dayDiff !== 0 && dayDiff >= 4; 
              const isUpcoming = !isToday && dayDiff > 0 && dayDiff <= 3;
              const isRestDay = !entry?.routine;

              const dateLabel = `${DAY_NAMES_SHORT[dayIndex]} • ${MONTH_NAMES_SHORT[date.getMonth()]} ${date.getDate()}`;

              if (isToday) {
                return (
                  <View
                    key={dayIndex}
                    className="rounded-2xl border-[1.5px] overflow-hidden my-2 shadow-2xl elevation-md"
                    style={{
                      backgroundColor: t.surfaceContainerHighest,
                      borderColor: t.primaryContainer,
                      shadowColor: t.primaryContainer,
                      shadowOpacity: 0.3,
                      shadowOffset: { width: 0, height: 0 },
                      shadowRadius: 15,
                    }}
                  >
                    {/* Decorative glow */}
                    <View
                      className="absolute -top-10 -right-10 w-32 h-32 rounded-full"
                      style={{ backgroundColor: `${t.primaryContainer}22` }}
                    />
                    <View className="p-4 gap-3">
                      <View className="flex-row justify-between items-center">
                        <View
                          className="px-2 py-1 rounded-[4px]"
                          style={{ backgroundColor: `${t.primaryContainer}18` }}
                        >
                          <Text className="text-[11px] font-bold tracking-[1.5px] uppercase" style={{ color: t.primaryContainer }}>
                            {DAY_NAMES_SHORT[dayIndex]} • TODAY
                          </Text>
                        </View>
                        <Text className="text-lg" style={{ color: t.primaryContainer }}>▲</Text>
                      </View>
                      <Text className="text-[32px] font-bold leading-9 tracking-tight" style={{ color: t.onSurface }}>
                        {entry?.routine?.name ?? 'Rest Day'}
                      </Text>
                      {entry?.routine && (
                        <View className="flex-row gap-4">
                          <View className="flex-row items-center gap-[6px]">
                            <Text className="text-sm" style={{ color: t.onSurfaceVariant }}>◷</Text>
                            <Text className="text-sm leading-5" style={{ color: t.onSurfaceVariant }}>
                              {Math.max(30, ((entry?.routine as RoutineWithExercises)?.exercises?.length ?? 4) * 8)} Min
                            </Text>
                          </View>
                          <View className="flex-row items-center gap-[6px]">
                            <Text className="text-sm" style={{ color: t.onSurfaceVariant }}>◉</Text>
                            <Text className="text-sm leading-5" style={{ color: t.onSurfaceVariant }}>
                              High Intensity
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                    {/* Primary CTA */}
                    <TouchableOpacity
                      className="h-16 items-center justify-center border-t"
                      style={{
                        backgroundColor: t.primaryContainer,
                        borderTopColor: `${t.primaryContainer}88`,
                      }}
                      activeOpacity={0.85}
                      onPress={() =>
                        entry?.routine
                          ? router.push({ pathname: '/workout', params: { id: entry.routine.id } })
                          : router.push('/exercises')
                      }
                    >
                      <Text className="text-[12px] font-bold tracking-[3px] uppercase text-black">
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
                  className="rounded-xl p-4 flex-row items-center justify-between border"
                  style={{
                    backgroundColor: isDone ? t.surfaceContainerLow : t.surfaceContainer,
                    borderColor: t.surfaceContainerHighest,
                    opacity: isDone ? 0.5 : isRestDay && isUpcoming ? 0.7 : 1,
                  }}
                >
                  <View className="gap-1">
                    <Text className="text-[11px] font-bold tracking-[1.5px] uppercase" style={{ color: t.onSurfaceVariant }}>
                      {dateLabel}
                    </Text>
                    <Text
                      className="text-2xl font-semibold"
                      style={[
                        { color: t.onSurface },
                        isDone && { textDecorationLine: 'line-through' },
                      ]}
                    >
                      {entry?.routine?.name ?? 'Rest Day'}
                    </Text>
                  </View>
                  {isDone ? (
                    <View className="flex-row items-center gap-[6px] p-2 rounded-lg" style={{ backgroundColor: t.surface }}>
                      <Text className="text-[11px] font-bold tracking-widest uppercase" style={{ color: t.onSurfaceVariant }}>✓ DONE</Text>
                    </View>
                  ) : isRestDay ? (
                    <Text className="text-xl" style={{ color: t.outline }}>💤</Text>
                  ) : (
                    <Text className="text-[11px] font-bold tracking-[2px] uppercase" style={{ color: t.outline }}>UPCOMING</Text>
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
