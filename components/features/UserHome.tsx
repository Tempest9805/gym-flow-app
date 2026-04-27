import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { CardBase, BaseButton } from '@/components/ui';
import { WeeklyAgenda } from './WeeklyAgenda';
import { useWeekSchedule } from '@/lib/hooks';
import type { Profile } from '@/types';

interface UserHomeProps {
  profile: Profile;
}

export function UserHome({ profile }: UserHomeProps) {
  const router = useRouter();
  const { data: schedule } = useWeekSchedule(profile.id);
  
  const today = new Date().getDay();
  const todaysRoutine = schedule?.find(s => s.day_of_week === today)?.routine;

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      <View className="mb-6">
        <Text className="text-3xl font-bold text-text-primary">Hello, {profile?.full_name || 'Athlete'}</Text>
        <Text className="text-lg text-text-secondary mt-1">Ready for today&apos;s session?</Text>
      </View>

      {/* Weekly Agenda */}
      <View className="mb-8">
        <Text className="text-sm font-bold text-text-secondary uppercase mb-3">This Week</Text>
        <WeeklyAgenda
          profile={profile}
        />
      </View>

      {/* Current Routine Card */}
      {todaysRoutine ? (
        <CardBase className="bg-primary-50 border-primary-100 mb-8 p-6">
          <Text className="text-sm font-bold text-primary-700 uppercase mb-2">Today's Routine</Text>
          <Text className="text-2xl font-bold text-text-primary mb-1">{todaysRoutine.name}</Text>
          <Text className="text-sm text-text-secondary mb-4">
            Get started with your scheduled workout.
          </Text>
          <BaseButton
            title="Start Workout"
            onPress={() => router.push({ pathname: '/workout', params: { id: todaysRoutine.id } })}
          />
        </CardBase>
      ) : (
        <CardBase className="mb-8 items-center py-10">
          <Text className="text-lg text-text-secondary mb-4">No routine scheduled for today</Text>
          <BaseButton title="Browse Exercises" variant="secondary" onPress={() => router.push('/exercises')} />
        </CardBase>
      )}
    </ScrollView>
  );
}
