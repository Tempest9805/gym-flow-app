import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { Router } from 'expo-router';
import { AppTopBar } from '@/components/ui/AppTopBar';
import { useTheme } from '@/lib/hooks/useTheme';
import { useExercises, useExerciseFilters } from '@/lib/hooks';
import { Image as ExpoImage } from 'expo-image';
import { cn } from '@/lib/utils/cn';
import type { Exercise, ThemeTokens } from '@/types';

export default function ExerciseLibraryScreen() {
  const router = useRouter();
  const t = useTheme();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { data: exercises, isLoading: isExercisesLoading } = useExercises();
  const { data: filters, isLoading: isFiltersLoading } = useExerciseFilters();

  const categories = useMemo(() => {
    if (!filters?.categories) return ['ALL'];
    return ['ALL', ...filters.categories.map((c) => String(c || '').toUpperCase())];
  }, [filters]);

  const filteredExercises = useMemo(() => {
    if (!exercises) return [];
    return exercises.filter((e) => {
      const name = (e.name_en || '').toLowerCase();
      const muscleGroup = (e.muscle_group || '').toLowerCase();
      const searchTerm = search.toLowerCase();

      const matchesSearch =
        name.includes(searchTerm) ||
        muscleGroup.includes(searchTerm);
        
      const matchesCategory =
        selectedCategory && selectedCategory !== 'ALL'
          ? (e.category || '').toUpperCase() === selectedCategory
          : true;
          
      return matchesSearch && matchesCategory;
    });
  }, [exercises, search, selectedCategory]);

  const isLoading = isExercisesLoading || isFiltersLoading;

  return (
    <SafeAreaView 
      className="flex-1" 
      style={{ backgroundColor: t.background }} 
      edges={['top']}
    >
      <AppTopBar />
      <FlatList
        className="flex-1"
        style={{ backgroundColor: t.background }}
        contentContainerStyle={{ paddingBottom: 120 }}
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        numColumns={1}
        ListHeaderComponent={
          <View className="pt-4 px-5 pb-2 gap-4">
            <Text 
              className="text-5xl font-extrabold tracking-tighter leading-tight"
              style={{ color: t.onBackground }}
            >
              Library
            </Text>

            <View 
              className="flex-row items-center h-16 rounded-xl border px-4 gap-3"
              style={{ backgroundColor: t.surface, borderColor: t.surfaceVariant }}
            >
              <Text className="text-lg" style={{ color: t.onSurfaceVariant }}>⌕</Text>
              <TextInput
                className="flex-1 text-lg leading-6"
                style={{ color: t.onSurface }}
                placeholder="Search exercises..."
                placeholderTextColor={t.onSurfaceVariant}
                value={search}
                onChangeText={setSearch}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="grow-0"
              contentContainerStyle={{ gap: 12, paddingRight: 20 }}
            >
              {categories.map((cat) => {
                const isActive = cat === (selectedCategory ?? 'ALL');
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setSelectedCategory(cat === 'ALL' ? null : cat)}
                    className={cn(
                      "h-10 px-5 rounded-full border items-center justify-center elevation shadow-md",
                    )}
                    style={[
                      isActive
                        ? {
                            backgroundColor: t.primaryContainer,
                            borderColor: t.primaryContainer,
                            shadowColor: t.primaryContainer,
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            shadowOffset: { width: 0, height: 0 },
                          }
                        : { backgroundColor: t.surfaceContainer, borderColor: t.surfaceVariant },
                    ]}
                  >
                    <Text
                      className="text-xs font-bold tracking-widest uppercase"
                      style={{ color: isActive ? t.onPrimaryContainer : t.onSurface }}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {isLoading && (
              <ActivityIndicator color={t.primaryContainer} className="mt-6" />
            )}
          </View>
        }
        renderItem={({ item }) => <ExerciseListItem item={item} t={t} router={router} />}
        ListEmptyComponent={
          !isLoading ? (
            <View className="py-16 items-center">
              <Text className="text-lg leading-6" style={{ color: t.onSurfaceVariant }}>
                No exercises found
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function ExerciseListItem({ item, t, router }: { item: Exercise; t: ThemeTokens; router: Router }) {
  const imageUrl = item.thumbnail_url || item.demonstration_url;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push(`/exercise/${item.id}`)}
      className="mx-5 mb-6 rounded-xl border overflow-hidden"
      style={{ backgroundColor: t.surface, borderColor: t.surfaceVariant }}
    >
      <View className="h-56 relative" style={{ backgroundColor: t.surfaceContainerHighest }}>
        {imageUrl ? (
          <ExpoImage
            source={{ uri: imageUrl }}
            className="w-full h-full opacity-80"
            contentFit="cover"
            transition={200}
            placeholder="L35O?*0000_300~qIVD%00-;~q%M"
          />
        ) : (
          <View className="flex-1 items-center justify-center" style={{ backgroundColor: t.surfaceContainerHigh }}>
            <Text className="text-5xl" style={{ color: t.outlineVariant }}>◆</Text>
          </View>
        )}
        <View className="absolute bottom-0 left-0 right-0 h-20 bg-black/50" />
        <View
          className="absolute top-4 left-4 px-3 py-1 rounded-full border"
          style={{
            backgroundColor: `${t.primaryContainer}22`,
            borderColor: `${t.primaryContainer}44`,
          }}
        >
          <Text className="text-[11px] font-bold tracking-widest uppercase" style={{ color: t.primaryContainer }}>
            {item.type?.toUpperCase() ?? 'STRENGTH'}
          </Text>
        </View>
      </View>

      <View className="flex-row justify-between items-end p-5 -mt-8 pt-8" style={{ backgroundColor: t.background }}>
        <View className="flex-1 gap-0.5">
          <Text className="text-[11px] font-bold tracking-widest uppercase" style={{ color: t.onSurfaceVariant }}>
            {(item.category || 'EXERCISE').toUpperCase()} • {(item.equipment || 'BODYWEIGHT').toUpperCase()}
          </Text>
          <Text className="text-2xl font-semibold" style={{ color: t.onSurface }}>
            {item.name_en || 'Untitled Exercise'}
          </Text>
        </View>
        <TouchableOpacity
          className="w-12 h-12 rounded-full items-center justify-center shadow-lg elevation-md shrink-0"
          style={{
            backgroundColor: t.primaryContainer,
            shadowColor: t.primaryContainer,
            shadowOpacity: 0.4,
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: 12,
          }}
          activeOpacity={0.8}
          onPress={() => router.push(`/exercise/${item.id}`)}
          accessibilityLabel={`View ${item.name_en}`}
        >
          <Text className="text-2xl font-bold" style={{ color: t.onPrimaryContainer }}>+</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
