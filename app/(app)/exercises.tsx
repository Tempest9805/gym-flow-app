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
import { useExercises, useExerciseFilters, useTranslation } from '@/lib/hooks';
import { Image as ExpoImage } from 'expo-image';
import { cn } from '@/lib/utils/cn';
import type { Exercise, ThemeTokens } from '@/types';
import { THUMB_MAP } from '@/lib/utils/mediaMap';

export default function ExerciseLibraryScreen() {
  const router = useRouter();
  const t = useTheme();
  const { t: translate } = useTranslation();
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
      const nameEn = (e.name_en || '').toLowerCase();
      const nameEs = (e.name_es || '').toLowerCase();
      const muscleGroup = (e.muscle_group || '').toLowerCase();
      const searchTerm = search.toLowerCase();

      const matchesSearch =
        nameEn.includes(searchTerm) ||
        nameEs.includes(searchTerm) ||
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
              {translate('exercises.library')}
            </Text>

            <View 
              className="flex-row items-center h-16 rounded-xl border px-4 gap-3"
              style={{ backgroundColor: t.surface, borderColor: t.surfaceVariant }}
            >
              <Text className="text-lg" style={{ color: t.onSurfaceVariant }}>⌕</Text>
              <TextInput
                className="flex-1 text-lg leading-6"
                style={{ color: t.onSurface }}
                placeholder={translate('exercises.searchPlaceholder')}
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
                {translate('exercises.noResults')}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

function ExerciseListItem({ item, t, router }: { item: Exercise; t: ThemeTokens; router: Router }) {
  const { language } = useTranslation();
  
  const normalizedSlug = item.slug
    ?.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  // Resolve image source through THUMB_MAP first, fallback to remote CDN URLs
  const localImage = normalizedSlug ? THUMB_MAP[normalizedSlug] : null;
  const imageSource = localImage 
    ? localImage 
    : (item.thumbnail_url || item.demonstration_url ? { uri: item.thumbnail_url || item.demonstration_url } : null);

  // Localization: name_es / name_en
  const displayName = language === 'es' && item.name_es ? item.name_es : item.name_en;

  // Color-coded difficulty badges matching the Stitch aesthetic
  const diffColor = useMemo(() => {
    switch (item.difficulty?.toLowerCase()) {
      case 'beginner':     return '#4ade80'; // vibrant green
      case 'intermediate': return '#facc15'; // vibrant amber
      case 'advanced':     return '#f87171'; // vibrant red
      default:             return t.primaryContainer;
    }
  }, [item.difficulty, t.primaryContainer]);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push(`/exercise/${item.id}`)}
      className="mx-5 mb-6 rounded-xl border overflow-hidden"
      style={{ backgroundColor: t.surface, borderColor: t.surfaceVariant }}
    >
      <View className="h-56 relative" style={{ backgroundColor: t.surfaceContainerHighest }}>
        <ExpoImage
          source={imageSource ?? undefined}
          style={{ width: '100%', height: '100%', opacity: 0.8 }}
          contentFit="cover"
          transition={200}
          placeholder="L35O?*0000_300~qIVD%00-;~q%M"
          onError={() => {}}
        />
        <View className="absolute bottom-0 left-0 right-0 h-20 bg-black/50" />
        
        {/* Category Badge pill - Top Left */}
        <View
          className="absolute top-4 left-4 px-3 py-1 rounded-full border"
          style={{
            backgroundColor: `${t.primaryContainer}22`,
            borderColor: `${t.primaryContainer}44`,
          }}
        >
          <Text className="text-[11px] font-bold tracking-widest uppercase" style={{ color: t.primaryContainer }}>
            {(item.category || 'EXERCISE').toUpperCase()}
          </Text>
        </View>

        {/* Difficulty Badge pill - Top Right */}
        {item.difficulty && (
          <View
            className="absolute top-4 right-4 px-3 py-1 rounded-full border"
            style={{
              backgroundColor: `${diffColor}22`,
              borderColor: `${diffColor}44`,
            }}
          >
            <Text className="text-[11px] font-bold tracking-widest uppercase" style={{ color: diffColor }}>
              {item.difficulty.toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <View className="flex-row justify-between items-end p-5 -mt-8 pt-8" style={{ backgroundColor: t.background }}>
        <View className="flex-1 gap-1">
          <Text className="text-[11px] font-bold tracking-widest uppercase" style={{ color: t.onSurfaceVariant }}>
            {item.type?.toUpperCase() ?? 'STRENGTH'} • {(item.equipment || 'BODYWEIGHT').toUpperCase()}
          </Text>
          <Text className="text-2xl font-bold tracking-tight" style={{ color: t.onSurface }}>
            {displayName}
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
          accessibilityLabel={`View ${displayName}`}
        >
          <Text className="text-2xl font-bold" style={{ color: t.onPrimaryContainer }}>+</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}
