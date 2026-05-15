import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RoutineWithExercises } from '@/types';
import { useRouter } from 'expo-router';
import { AppTopBar } from '@/components/ui/AppTopBar';
import { useTheme } from '@/lib/hooks/useTheme';
import { useCurrentProfile, useWeekSchedule } from '@/lib/hooks';
import { useSessionStore } from '@/lib/store/sessionStore';
import { cn } from '@/lib/utils/cn';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getWeekStart(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
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
  const todaysRoutine = todaysEntry?.routine as RoutineWithExercises | undefined;

  const upcomingDays = schedule
    ?.filter((s) => s.day_of_week !== todayIndex && s.routine)
    .slice(0, 2) ?? [];

  const athleteName = profile?.full_name?.split(' ')[0]?.toUpperCase() || 'ATHLETE';

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
          paddingBottom: 120,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-8">
          {/* ── 1. Greeting ── */}
          <View>
            <Text 
              className="text-5xl font-extrabold leading-tight tracking-tighter uppercase"
              style={{ color: t.onBackground }}
            >
              HELLO,{'\n'}
              <Text style={{ color: t.outlineVariant }}>
                {profileLoading ? '...' : athleteName}
              </Text>
            </Text>
          </View>

          {/* ── 2. Weekly Tracker ── */}
          <View className="flex-row justify-between py-2">
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
                  className={cn(
                    "flex-1 mx-1 rounded-lg py-2 items-center gap-1",
                    isToday && "border"
                  )}
                  style={[
                    isToday && { borderColor: t.primaryContainer },
                    isCompleted ? { backgroundColor: t.primaryContainer } : { backgroundColor: t.surfaceContainer },
                  ]}
                >
                  <Text
                    className="text-xs font-semibold uppercase"
                    style={{ color: isCompleted ? t.onPrimaryContainer : t.onSurfaceVariant }}
                  >
                    {dayName.slice(0, 2)}
                  </Text>
                  <Text 
                    className="text-sm font-extrabold"
                    style={{ color: isCompleted ? t.onPrimaryContainer : t.outlineVariant }}
                  >
                    {isCompleted ? '✓' : '✕'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── 3. Today's Routine ── */}
          {todaysRoutine ? (
            <View className="gap-4">
              <View className="gap-3">
                <Text 
                  className="text-3xl font-extrabold uppercase tracking-tight"
                  style={{ color: t.onBackground }}
                >
                  {todaysRoutine.name.toUpperCase()}
                </Text>
                
                <View 
                  className="p-3 rounded-lg border gap-1"
                  style={{ backgroundColor: t.surfaceContainerLow, borderColor: t.surfaceContainerHighest }}
                >
                  <Text className="text-xs leading-5" style={{ color: t.onSurfaceVariant }}>
                    <Text className="font-bold">Series</Text> = cuántas veces repites el ejercicio
                  </Text>
                  <Text className="text-xs leading-5" style={{ color: t.onSurfaceVariant }}>
                    <Text className="font-bold">Repeticiones</Text> = cuántas veces haces el movimiento en cada serie
                  </Text>
                </View>
              </View>

              <View className="gap-3">
                {todaysRoutine.exercises?.map((item) => {
                  const isCompleted = completedExercises[item.id];
                  return (
                    <View
                      key={item.id}
                      className="flex-row items-center p-4 rounded-xl border gap-4"
                      style={{
                        backgroundColor: t.surface,
                        borderColor: isCompleted ? t.primaryContainer : t.surfaceContainerHighest,
                      }}
                    >
                      <TouchableOpacity
                        className="flex-1 gap-1"
                        onPress={() => handleNavigateToExercise(item.exercise_id)}
                        activeOpacity={0.7}
                        accessibilityRole="link"
                        accessibilityLabel={`View details for ${item.exercise?.name_en}`}
                      >
                        <Text 
                          className={cn(
                            "text-lg font-bold uppercase",
                            isCompleted && "line-through"
                          )}
                          style={{ color: isCompleted ? t.outline : t.onSurface }}
                        >
                          {item.exercise?.name_en?.toUpperCase()}
                        </Text>
                        <Text className="text-sm font-medium" style={{ color: t.onSurfaceVariant }}>
                          {item.sets} series x {item.reps ? `${item.reps} reps` : `${item.duration_seconds}s`}
                          {item.rest_seconds ? ` • ${item.rest_seconds}s rest` : ''}
                        </Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        className="w-8 h-8 rounded-full border-2 items-center justify-center"
                        style={[
                          isCompleted 
                            ? { backgroundColor: t.primaryContainer, borderColor: t.primaryContainer }
                            : { backgroundColor: 'transparent', borderColor: t.outlineVariant }
                        ]}
                        onPress={() => handleToggleExercise(item.id)}
                        accessibilityRole="checkbox"
                        accessibilityLabel={`Mark ${item.exercise?.name_en} as completed`}
                        accessibilityState={{ checked: isCompleted }}
                      >
                        {isCompleted && (
                          <Text className="text-base font-extrabold" style={{ color: t.onPrimaryContainer }}>✓</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : (
            <View
              className="rounded-xl border p-6 gap-6"
              style={{
                backgroundColor: t.surface,
                borderColor: t.surfaceContainerHighest,
              }}
            >
              <View className="flex-row justify-between items-start">
                <View className="gap-2">
                  <Text className="text-[11px] font-bold tracking-[2px] uppercase" style={{ color: t.onSurfaceVariant }}>
                    TODAY
                  </Text>
                  <Text 
                    className="text-3xl font-bold leading-9 tracking-tight uppercase"
                    style={{ color: t.onBackground }}
                  >
                    REST DAY
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                className="h-16 rounded-lg items-center justify-center elevation-lg shadow-lg"
                style={{
                  backgroundColor: t.primaryContainer,
                  shadowColor: t.primaryContainer,
                  shadowOpacity: 0.3,
                  shadowOffset: { width: 0, height: 0 },
                  shadowRadius: 16,
                }}
                activeOpacity={0.85}
                onPress={() => router.push('/exercises')}
              >
                <Text className="text-base font-bold tracking-[3px] uppercase" style={{ color: t.onPrimaryContainer }}>
                  BROWSE EXERCISES
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── 4. Minimal stats bento ── */}
          <View className="flex-row gap-3">
            <View
              className="flex-1 rounded-lg p-4 border gap-2"
              style={{ backgroundColor: t.surface, borderColor: t.surfaceContainerHighest }}
            >
              <Text className="text-[11px] font-bold tracking-[1px] uppercase" style={{ color: t.onSurfaceVariant }}>▲ Weekly Load</Text>
              <Text className="text-3xl font-bold leading-9" style={{ color: t.onBackground }}>
                {(schedule?.filter((s) => s.routine).length ?? 0)}
                <Text className="text-xl font-normal" style={{ color: t.outlineVariant }}> days</Text>
              </Text>
            </View>
            <View
              className="flex-1 rounded-lg p-4 border gap-2"
              style={{ backgroundColor: t.surface, borderColor: t.surfaceContainerHighest }}
            >
              <Text className="text-[11px] font-bold tracking-[1px] uppercase" style={{ color: t.onSurfaceVariant }}>♥ Recovery</Text>
              <Text className="text-3xl font-bold leading-9" style={{ color: t.secondary }}>
                {todaysRoutine ? '72' : '94'}
                <Text className="text-xl font-normal" style={{ color: t.outlineVariant }}>%</Text>
              </Text>
            </View>
          </View>

          {/* ── 5. Agenda preview ── */}
          <View className="gap-4">
            <Text className="text-2xl font-semibold uppercase" style={{ color: t.onBackground }}>Agenda</Text>
            {scheduleLoading ? (
              <ActivityIndicator color={t.primaryContainer} className="mt-3" />
            ) : upcomingDays.length === 0 ? (
              <View
                className="rounded-lg p-6 items-center gap-4"
                style={{ backgroundColor: t.surface }}
              >
                <Text className="text-base text-center leading-6" style={{ color: t.onSurfaceVariant }}>
                  No upcoming workouts. Create a routine to get started.
                </Text>
                <TouchableOpacity
                  className="border rounded-lg px-6 py-3"
                  style={{ borderColor: t.surfaceContainerHighest }}
                  onPress={() => router.push('/routines')}
                >
                  <Text className="text-xs font-bold tracking-[2px] uppercase" style={{ color: t.primaryContainer }}>
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
                    className="rounded-lg p-4 flex-row items-center gap-4"
                    style={{ backgroundColor: t.surface }}
                    activeOpacity={0.7}
                    onPress={() => router.push('/agenda')}
                  >
                    <View 
                      className="w-12 h-12 rounded-md items-center justify-center"
                      style={{ backgroundColor: t.surfaceContainer }}
                    >
                      <Text className="text-[11px] font-bold tracking-[1px] uppercase" style={{ color: t.onSurfaceVariant }}>
                        {DAY_NAMES[entry.day_of_week].toUpperCase()}
                      </Text>
                      <Text className="text-base font-bold" style={{ color: t.onBackground }}>
                        {d.getDate()}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-lg font-bold uppercase" style={{ color: t.onBackground }}>
                        {entry.routine?.name?.toUpperCase()}
                      </Text>
                      <Text className="text-sm mt-0.5" style={{ color: t.onSurfaceVariant }}>
                        {Math.max(30, ((entry.routine as RoutineWithExercises)?.exercises?.length ?? 4) * 8)}m • Strength
                      </Text>
                    </View>
                    <Text className="text-2xl" style={{ color: t.outlineVariant }}>›</Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}