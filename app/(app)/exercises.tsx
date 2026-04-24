import React, { useState } from 'react';
import { View, Text, FlatList, TextInput } from 'react-native';
import { ScreenContainer, CardBase, LoadingScreen } from '@/components/ui';
import { useExercises } from '@/lib/hooks';

export default function ExerciseLibraryScreen() {
  const [search, setSearch] = useState('');
  const { data: exercises, isLoading } = useExercises();

  const filteredExercises = exercises?.filter(e => 
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.muscle_group.toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ScreenContainer>
      <View className="mb-6">
        <Text className="text-3xl font-bold text-text-primary">Exercises</Text>
        <Text className="text-lg text-text-secondary mt-1">Explore our movement library</Text>
      </View>

      <TextInput
        placeholder="Search exercises..."
        value={search}
        onChangeText={setSearch}
        className="bg-surface-secondary rounded-button px-5 py-4 text-lg mb-6 text-text-primary"
        placeholderTextColor="#6c757d"
      />

      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <CardBase className="mb-4 flex-row items-center p-4">
            <View className="flex-1">
              <Text className="text-lg font-bold text-text-primary">{item.name}</Text>
              <Text className="text-sm text-text-secondary uppercase">{item.muscle_group} · {item.category}</Text>
            </View>
            <Text className="text-2xl text-primary-500">→</Text>
          </CardBase>
        )}
      />
    </ScreenContainer>
  );
}
