import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScreenContainer, CardBase, BaseButton, LoadingScreen } from '@/components/ui';
import { useRoutine } from '@/lib/hooks';

export default function WorkoutSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: routine, isLoading } = useRoutine(id);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!routine || !routine.exercises[currentIndex]) {
    return (
      <ScreenContainer className="justify-center items-center">
        <Text className="text-xl font-bold mb-4">Workout Complete! 🎉</Text>
        <BaseButton title="Finish & Save" onPress={() => router.replace('/(app)')} />
      </ScreenContainer>
    );
  }

  const currentItem = routine.exercises[currentIndex];
  const isLast = currentIndex === routine.exercises.length - 1;

  return (
    <ScreenContainer>
      {/* Progress */}
      <View className="mb-8">
        <View className="h-2 bg-surface-secondary rounded-full overflow-hidden">
          <View 
            className="h-full bg-primary-500" 
            style={{ width: `${((currentIndex + 1) / routine.exercises.length) * 100}%` }}
          />
        </View>
        <Text className="text-center text-text-secondary mt-2 font-bold">
          Exercise {currentIndex + 1} of {routine.exercises.length}
        </Text>
      </View>

      {/* Focus Area */}
      <View className="flex-1 justify-center items-center">
        <CardBase className="w-full py-12 items-center">
          <Text className="text-sm font-bold text-primary-600 uppercase mb-2">Focus on</Text>
          <Text className="text-4xl font-bold text-text-primary text-center mb-6">
            {currentItem.exercise.name}
          </Text>
          
          <View className="flex-row gap-8">
            <View className="items-center">
              <Text className="text-4xl font-bold text-text-primary">{currentItem.sets}</Text>
              <Text className="text-sm text-text-secondary">Sets</Text>
            </View>
            <View className="items-center">
              <Text className="text-4xl font-bold text-text-primary">
                {currentItem.reps || currentItem.duration_seconds}
              </Text>
              <Text className="text-sm text-text-secondary">
                {currentItem.reps ? 'Reps' : 'Seconds'}
              </Text>
            </View>
          </View>
        </CardBase>

        <Text className="text-center text-text-secondary mt-10 px-6 italic">
          Tip: {currentItem.notes || 'Focus on controlled movement and proper form.'}
        </Text>
      </View>

      {/* Primary Action */}
      <View className="mt-auto pb-6">
        <BaseButton 
          title={isLast ? "Finish Workout" : "Next Exercise"} 
          onPress={() => setCurrentIndex(prev => prev + 1)} 
        />
        <BaseButton 
          title="Pause" 
          variant="ghost" 
          className="mt-2"
          onPress={() => router.back()} 
        />
      </View>
    </ScreenContainer>
  );
}
