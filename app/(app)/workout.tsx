import React from 'react';
import { View, Text, FlatList } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer, CardBase, BaseButton, LoadingScreen } from '@/components/ui';
import { useRoutine } from '@/lib/hooks';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: routine, isLoading } = useRoutine(id);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!routine) {
    return (
      <ScreenContainer className="justify-center items-center">
        <Text className="text-lg text-text-secondary mb-4">Routine not found</Text>
        <BaseButton title="Go Back" variant="ghost" onPress={() => router.back()} />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <View className="mb-6">
        <Text className="text-3xl font-bold text-text-primary">{routine.name}</Text>
        <Text className="text-lg text-text-secondary mt-1">
          {routine.exercises.length} Exercises · Approx. 45 mins
        </Text>
      </View>

      <FlatList
        data={routine.exercises}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        renderItem={({ item }) => (
          <CardBase className="mb-4 flex-row items-center p-4">
            <View className="w-12 h-12 bg-surface-secondary rounded-full items-center justify-center mr-4">
              <Text className="text-lg font-bold text-primary-600">{item.order_index + 1}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold text-text-primary">{item.exercise.name}</Text>
              <Text className="text-sm text-text-secondary">
                {item.sets} sets · {item.reps ? `${item.reps} reps` : `${item.duration_seconds}s`}
              </Text>
            </View>
          </CardBase>
        )}
      />

      <View className="absolute bottom-6 left-6 right-6">
        <BaseButton 
          title="Start Session" 
          onPress={() => router.push({ pathname: '/workout-session', params: { id: routine.id } })} 
        />
      </View>
    </ScreenContainer>
  );
}
