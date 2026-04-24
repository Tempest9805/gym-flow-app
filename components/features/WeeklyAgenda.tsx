/**
 * WeeklyAgenda — Kiosk-style weekly workout selector.
 *
 * Displays 7 days as large tap targets.
 * Status per day: empty | assigned | completed.
 * Primary action: "Start Workout" on the selected day.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { BaseButton } from '@/components/ui';
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
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(todayIndex);

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

  const selectedEntry = dayMap.get(selectedDay);

  const handleDayPress = (day: DayOfWeek) => {
    setSelectedDay(day);
  };

  const handleDayLongPress = (day: DayOfWeek) => {
    if (!activeRoutineId) return;
    toggleDay.mutate({
      dayOfWeek: day,
      routineId: activeRoutineId,
      gymId: profile.gym_id,
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
      <View className="flex-row justify-between mb-4">
        {DAY_LABELS.map((label, index) => {
          const day = index as DayOfWeek;
          const status = getDayStatus(day);
          const isSelected = selectedDay === day;
          const isToday = todayIndex === day;

          return (
            <Pressable
              key={day}
              onPress={() => handleDayPress(day)}
              onLongPress={() => handleDayLongPress(day)}
              className={`
                flex-1 mx-1 items-center py-3 rounded-lg
                min-h-[72px] justify-center
                ${isSelected
                  ? 'bg-primary-600'
                  : status === 'assigned'
                    ? 'bg-primary-100'
                    : 'bg-surface-tertiary'
                }
              `}
            >
              {/* Day Label */}
              <Text
                className={`text-xs font-bold uppercase mb-1 ${
                  isSelected ? 'text-white' : 'text-text-secondary'
                }`}
              >
                {label}
              </Text>

              {/* Status Indicator */}
              <View
                className={`w-3 h-3 rounded-full ${
                  isSelected
                    ? 'bg-white'
                    : status === 'assigned'
                      ? 'bg-primary-500'
                      : 'bg-transparent border border-text-secondary'
                }`}
              />

              {/* Today marker */}
              {isToday && !isSelected && (
                <View className="w-1.5 h-1.5 rounded-full bg-error mt-1" />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Selected Day Detail */}
      <View className="bg-surface-secondary rounded-card p-4 min-h-[80px] justify-center">
        {selectedEntry ? (
          <View>
            <Text className="text-xs font-bold text-primary-600 uppercase mb-1">
              {DAY_LABELS[selectedDay]} — Assigned
            </Text>
            <Text className="text-xl font-bold text-text-primary mb-3">
              {selectedEntry.routine.name}
            </Text>
            <BaseButton
              title="Start Workout"
              onPress={() =>
                router.push({
                  pathname: '/workout',
                  params: { id: selectedEntry.routine_id },
                })
              }
            />
          </View>
        ) : (
          <View className="items-center py-2">
            <Text className="text-text-secondary text-base">
              {DAY_LABELS[selectedDay]} — Rest Day
            </Text>
            {activeRoutineId && (
              <Text className="text-xs text-text-secondary mt-1">
                Long press a day to assign your routine
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}
