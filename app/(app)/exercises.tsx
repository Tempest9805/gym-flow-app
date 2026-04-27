import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer, CardBase, LoadingScreen } from '@/components/ui';
import { useExercises, useExerciseFilters } from '@/lib/hooks';

export default function ExerciseLibraryScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const { data: exercises, isLoading: isExercisesLoading } = useExercises();
  const { data: filters, isLoading: isFiltersLoading } = useExerciseFilters();

  const categories = useMemo(() => {
    if (!filters?.categories) return [];
    return ['All', ...filters.categories];
  }, [filters]);

  const filteredExercises = useMemo(() => {
    if (!exercises) return [];
    return exercises.filter(e => {
      const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
                            e.muscle_group.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = selectedCategory && selectedCategory !== 'All' 
        ? e.category === selectedCategory 
        : true;
        
      return matchesSearch && matchesCategory;
    });
  }, [exercises, search, selectedCategory]);

  if (isExercisesLoading || isFiltersLoading) {
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
        className="bg-surface-secondary border border-border rounded-button px-5 py-4 text-lg mb-4 text-text-primary"
        placeholderTextColor="#6c757d"
      />

      {categories.length > 0 && (
        <View className="mb-6">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {categories.map((category) => {
              const isSelected = selectedCategory === category || (category === 'All' && !selectedCategory);
              return (
                <TouchableOpacity
                  key={category}
                  onPress={() => setSelectedCategory(category === 'All' ? null : category)}
                  className={`px-4 py-2 rounded-full mr-2 ${isSelected ? 'bg-primary' : 'bg-surface-secondary'}`}
                >
                  <Text className={`font-bold ${isSelected ? 'text-text-inverse' : 'text-text-secondary'}`}>
                    {category}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity 
            activeOpacity={0.7}
            onPress={() => router.push(`/exercise/${item.id}`)}
          >
            <CardBase className="mb-4 flex-row items-center p-4">
              <View className="flex-1">
                <Text className="text-lg font-bold text-text-primary">{item.name}</Text>
                <Text className="text-sm text-text-secondary uppercase mt-1">
                  {item.category} · {item.muscle_group}
                </Text>
              </View>
              <Text className="text-2xl text-primary">→</Text>
            </CardBase>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="py-10 items-center">
            <Text className="text-text-secondary text-lg">No exercises found</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}
