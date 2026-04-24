import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { CardBase, BaseButton } from '@/components/ui';
import type { Profile } from '@/types';

interface CoachHomeProps {
  profile: Profile;
}

export function CoachHome({ profile }: CoachHomeProps) {
  const router = useRouter();

  return (
    <View className="flex-1">
      <View className="mb-10">
        <Text className="text-3xl font-bold text-text-primary">Facility Health</Text>
        <Text className="text-lg text-text-secondary mt-1">{profile?.gym_id || 'Global Context'}</Text>
      </View>

      <CardBase className="mb-8 items-center py-12">
        {/* Placeholder for real metric data */}
        <Text className="text-2xl font-bold text-primary-600 mb-2">84%</Text>
        <Text className="text-base text-text-secondary mb-6">User Engagement Today</Text>
        <BaseButton title="View Detailed Stats" onPress={() => router.push('/dashboard')} />
      </CardBase>
    </View>
  );
}
