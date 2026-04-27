import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer, CardBase, BaseButton, LoadingScreen } from '@/components/ui';
import { useWeekSchedule, useCurrentProfile, useClearScheduleDay } from '@/lib/hooks';
import type { DayOfWeek } from '@/types';

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DayDetailScreen() {
  const { day } = useLocalSearchParams<{ day: string }>();
  const router = useRouter();
  const { data: profile } = useCurrentProfile();
  const { data: schedule, isLoading } = useWeekSchedule(profile?.id);
  const clearDay = useClearScheduleDay(profile?.id);

  if (isLoading || !profile) {
    return <LoadingScreen />;
  }

  const dayIndex = parseInt(day ?? '0', 10) as DayOfWeek;
  const dayName = DAY_LABELS[dayIndex];

  const routineForDay = schedule?.find((s) => s.day_of_week === dayIndex)?.routine;

  const handleClearDay = async () => {
    try {
      await clearDay.mutateAsync(dayIndex);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <ScreenContainer>
      <View className="mb-6 flex-row justify-between items-center">
        <View>
          <Text className="text-sm font-bold text-primary-600 uppercase mb-1">Weekly Agenda</Text>
          <Text className="text-3xl font-bold text-text-primary">{dayName}</Text>
        </View>
        <BaseButton title="Back" variant="ghost" size="sm" onPress={() => router.back()} />
      </View>

      {routineForDay ? (
        <CardBase className="p-6 mt-4">
          <Text className="text-sm font-bold text-primary-700 uppercase mb-2">Scheduled Routine</Text>
          <Text className="text-2xl font-bold text-text-primary mb-1">{routineForDay.name}</Text>
          <Text className="text-sm text-text-secondary mb-6">Status: {routineForDay.status}</Text>
          
          <View className="flex-col gap-3">
            <BaseButton
              title="View & Start Workout"
              onPress={() => router.push({ pathname: '/workout', params: { id: routineForDay.id } })}
            />
            <BaseButton
              title="Clear Day"
              variant="outline"
              onPress={handleClearDay}
            />
          </View>
        </CardBase>
      ) : (
        <View className="flex-1 justify-center items-center py-20">
          <Text className="text-xl text-text-primary font-bold mb-2">Rest Day</Text>
          <Text className="text-text-secondary text-center mb-8 px-4">
            No routine is scheduled for {dayName}. Enjoy your rest or assign a routine to get moving!
          </Text>
          <View className="w-full max-w-xs gap-3">
            <BaseButton
              title="Assign Existing Routine"
              onPress={() => router.push('/routines')}
            />
            <BaseButton
              title="Build New Routine"
              variant="outline"
              onPress={() => router.push('/routine-builder')}
            />
          </View>
        </View>
      )}
    </ScreenContainer>
  );
}
