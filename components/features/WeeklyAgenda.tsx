/**
 * WeeklyAgenda — Kiosk-style weekly workout selector.
 *
 * Displays 7 days as large tap targets.
 * Status per day: empty | assigned | completed.
 * Primary action: Tap to open day detail.
 */
import React, { useMemo } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useWeekSchedule, useToggleScheduleDay } from '@/lib/hooks';
import type { Profile, DayOfWeek, WorkoutScheduleWithRoutine } from '@/types';

const DAY_LABELS: string[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface WeeklyAgendaProps {
  profile: Profile;
  /** The active assignment's routine ID — used when toggling days on */
  activeRoutineId?: string;
}

type DayStatus = 'empty' | 'assigned' | 'today';

export function WeeklyAgenda({ profile, activeRoutineId }: WeeklyAgendaProps) {
  const router = useRouter();
  const { data: schedule, isLoading } = useWeekSchedule(profile.id);
  const toggleDay = useToggleScheduleDay(profile.id);

  const todayIndex = new Date().getDay() as DayOfWeek;

  // Build a map: dayOfWeek → schedule entry
  const dayMap = useMemo(() => {
    const map = new Map<DayOfWeek, WorkoutScheduleWithRoutine>();
    schedule?.forEach((entry) => {
      map.set(entry.day_of_week, entry);
    });
    return map;
  }, [schedule]);

  const getDayStatus = (day: DayOfWeek): DayStatus => {
    if (dayMap.has(day)) return 'assigned';
    return 'empty';
  };

  const handleDayPress = (day: DayOfWeek) => {
    router.push({ pathname: '/day-detail', params: { day: String(day) } });
  };

  const handleDayLongPress = (day: DayOfWeek) => {
    if (!activeRoutineId) return;
    toggleDay.mutate({
      dayOfWeek: day,
      routineId: activeRoutineId,
    });
  };

  if (isLoading) {
    return (
      <View className="py-6 items-center">
        <ActivityIndicator size="small" color="#0072cd" />
      </View>
    );
  }

  return (
    <View>
      {/* Day Grid — 7 columns */}
      <View className="flex-row justify-between">
        {DAY_LABELS.map((label, index) => {
          const day = index as DayOfWeek;
          const status = getDayStatus(day);
          const isToday = todayIndex === day;

          return (
            <Pressable
              key={day}
              onPress={() => handleDayPress(day)}
              onLongPress={() => handleDayLongPress(day)}
              className={`
                flex-1 mx-1 items-center py-3 rounded-lg
                min-h-[72px] justify-center
                ${
                  status === 'assigned'
                    ? 'bg-primary-100'
                    : 'bg-surface-tertiary'
                }
              `}
            >
              {/* Day Label */}
              <Text
                className={`text-xs font-bold uppercase mb-1 text-text-secondary`}
              >
                {label}
              </Text>

              {/* Status Indicator */}
              <View
                className={`w-3 h-3 rounded-full ${
                  status === 'assigned'
                    ? 'bg-primary-500'
                    : 'bg-transparent border border-text-secondary'
                }`}
              />

              {/* Today marker */}
              {isToday && (
                <View className="w-1.5 h-1.5 rounded-full bg-error mt-1" />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
