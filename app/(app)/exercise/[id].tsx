import React from 'react';
import { View, Text, ScrollView, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer, BaseButton, LoadingScreen, CardBase } from '@/components/ui';
import { useExercise } from '@/lib/hooks';

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: exercise, isLoading } = useExercise(id);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!exercise) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center">
          <Text className="text-xl font-bold text-text-primary mb-4">Exercise not found</Text>
          <BaseButton title="Go Back" onPress={() => router.back()} />
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Header with Back Button */}
        <View className="mb-6 flex-row items-center">
          <BaseButton 
            title="← Back" 
            variant="ghost" 
            onPress={() => router.back()} 
          />
        </View>

        {/* Title & Category */}
        <View className="mb-6">
          <Text className="text-3xl font-bold text-text-primary mb-2">
            {exercise.name}
          </Text>
          <View className="flex-row flex-wrap gap-2">
            <View className="bg-primary-100 px-3 py-1 rounded-full">
              <Text className="text-primary-700 text-sm font-bold uppercase">{exercise.category}</Text>
            </View>
            <View className="bg-surface-secondary px-3 py-1 rounded-full">
              <Text className="text-text-secondary text-sm font-bold uppercase">{exercise.muscle_group}</Text>
            </View>
          </View>
        </View>

        {/* Demonstration */}
        {exercise.demonstration_url ? (
          <View className="mb-8 rounded-xl overflow-hidden bg-surface-secondary items-center justify-center min-h-[250px]">
            <Image 
              source={{ uri: exercise.demonstration_url }} 
              className="w-full h-64"
              resizeMode="cover"
            />
          </View>
        ) : (
          <View className="mb-8 rounded-xl bg-surface-secondary items-center justify-center py-12">
            <Text className="text-text-secondary text-lg">No demonstration available</Text>
          </View>
        )}

        {/* Instructions */}
        <CardBase className="mb-8 p-6">
          <Text className="text-xl font-bold text-text-primary mb-4">Execution Guidance</Text>
          {exercise.description ? (
            <Text className="text-base text-text-secondary leading-relaxed">
              {exercise.description}
            </Text>
          ) : (
            <Text className="text-base text-text-secondary italic">
              No detailed instructions provided for this exercise yet.
            </Text>
          )}
        </CardBase>
        
        {/* Extra bottom spacing */}
        <View className="h-8" />
      </ScrollView>
    </ScreenContainer>
  );
}
