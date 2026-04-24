import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer, CardBase, BaseButton, LoadingScreen } from '@/components/ui';
import { useRoutines, useCurrentProfile } from '@/lib/hooks';

export default function RoutinesScreen() {
  const router = useRouter();
  const { data: profile } = useCurrentProfile();
  const { data: routines, isLoading } = useRoutines(profile || undefined);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ScreenContainer>
      <View className="mb-6">
        <Text className="text-3xl font-bold text-text-primary">Routines</Text>
        <Text className="text-lg text-text-secondary mt-1">Your training blueprints</Text>
      </View>

      <FlatList
        data={routines}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <CardBase className="mb-4 p-5">
            <View className="flex-row justify-between items-center mb-4">
              <View>
                <Text className="text-xl font-bold text-text-primary">{item.name}</Text>
                <Text className="text-sm text-text-secondary uppercase">{item.status}</Text>
              </View>
              <BaseButton 
                title="Edit" 
                variant="ghost" 
                size="sm" 
                onPress={() => {}} 
              />
            </View>
            <BaseButton 
              title="Assign to Athlete" 
              variant="outline" 
              onPress={() => {}} 
            />
          </CardBase>
        )}
        ListEmptyComponent={
          <View className="py-20 items-center">
            <Text className="text-text-secondary text-lg">No routines yet</Text>
          </View>
        }
      />

      <View className="absolute bottom-6 left-6 right-6">
        <BaseButton 
          title="Create New Routine" 
          onPress={() => {}} 
        />
      </View>
    </ScreenContainer>
  );
}
