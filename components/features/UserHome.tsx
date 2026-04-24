import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { CardBase, BaseButton } from '@/components/ui';
import { WeeklyAgenda } from './WeeklyAgenda';
import type { Profile, AssignmentWithDetails } from '@/types';

interface UserHomeProps {
  profile: Profile;
  assignments: AssignmentWithDetails[];
}

export function UserHome({ profile, assignments }: UserHomeProps) {
  const router = useRouter();
  const latestAssignment = assignments?.[0];

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
          activeRoutineId={latestAssignment?.routine_id}
        />
      </View>

      {/* Current Routine Card */}
      {latestAssignment ? (
        <CardBase className="bg-primary-50 border-primary-100 mb-8 p-6">
          <Text className="text-sm font-bold text-primary-700 uppercase mb-2">Your Routine</Text>
          <Text className="text-2xl font-bold text-text-primary mb-1">{latestAssignment.routine.name}</Text>
          <Text className="text-sm text-text-secondary mb-4">
            {latestAssignment.routine.exercises?.length || 0} exercises
          </Text>
          <BaseButton
            title="Start Workout"
            onPress={() => router.push({ pathname: '/workout', params: { id: latestAssignment.id } })}
          />
        </CardBase>
      ) : (
        <CardBase className="mb-8 items-center py-10">
          <Text className="text-lg text-text-secondary mb-4">No active assignments</Text>
          <BaseButton title="Browse Exercises" variant="secondary" onPress={() => router.push('/exercises')} />
        </CardBase>
      )}
    </ScrollView>
  );
}
