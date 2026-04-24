import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { CardBase, BaseButton } from '@/components/ui';
import type { Profile } from '@/types';

interface TrainerHomeProps {
  profile: Profile;
}

export function TrainerHome({ profile }: TrainerHomeProps) {
  const router = useRouter();

  return (
    <View className="flex-1">
      <View className="mb-10">
        <Text className="text-3xl font-bold text-text-primary">Coach Dashboard</Text>
        <Text className="text-lg text-text-secondary mt-1">Manage your athletes and plans</Text>
      </View>

      <CardBase className="mb-6 items-center py-12">
        <Text className="text-xl font-bold text-text-primary mb-4">Create New Routine</Text>
        <BaseButton title="Open Builder" onPress={() => router.push('/routines')} />
      </CardBase>

      <CardBase className="items-center py-12">
        <Text className="text-xl font-bold text-text-primary mb-4">Your Athletes</Text>
        <BaseButton title="View Roster" variant="secondary" onPress={() => router.push('/dashboard')} />
      </CardBase>
    </View>
  );
}
