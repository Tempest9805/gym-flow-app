import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { ScreenContainer, CardBase, BaseButton, LoadingScreen } from '@/components/ui';
import { useCurrentProfile } from '@/lib/hooks';

const MOCK_ATHLETES = [
  { id: '1', name: 'John Doe', lastWorkout: '2 days ago', status: 'Active' },
  { id: '2', name: 'Jane Smith', lastWorkout: 'Today', status: 'Active' },
  { id: '3', name: 'Mike Ross', lastWorkout: 'Never', status: 'Pending' },
];

export default function DashboardScreen() {
  const { data: profile, isLoading } = useCurrentProfile();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ScreenContainer>
      <View className="mb-8">
        <Text className="text-3xl font-bold text-text-primary">Performance</Text>
        <Text className="text-lg text-text-secondary mt-1">Gym Overview</Text>
      </View>

      {/* Quick Stats */}
      <View className="flex-row gap-4 mb-8">
        <CardBase className="flex-1 items-center">
          <Text className="text-2xl font-bold text-primary-600">24</Text>
          <Text className="text-xs text-text-secondary uppercase">Athletes</Text>
        </CardBase>
        <CardBase className="flex-1 items-center">
          <Text className="text-2xl font-bold text-primary-600">12</Text>
          <Text className="text-xs text-text-secondary uppercase">Active Today</Text>
        </CardBase>
      </View>

      <Text className="text-xl font-bold text-text-primary mb-4">Your Athletes</Text>
      <FlatList
        data={MOCK_ATHLETES}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CardBase className="mb-3 flex-row items-center justify-between p-4">
            <View>
              <Text className="text-lg font-bold text-text-primary">{item.name}</Text>
              <Text className="text-sm text-text-secondary">Last session: {item.lastWorkout}</Text>
            </View>
            <View className={`px-3 py-1 rounded-full ${item.status === 'Active' ? 'bg-green-100' : 'bg-yellow-100'}`}>
              <Text className={`text-xs font-bold ${item.status === 'Active' ? 'text-green-700' : 'text-yellow-700'}`}>
                {item.status}
              </Text>
            </View>
          </CardBase>
        )}
      />

      <View className="mt-8">
        <BaseButton title="Invite New Athlete" onPress={() => {}} />
      </View>
    </ScreenContainer>
  );
}
