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
import { useExercises, useTranslation } from '@/lib/hooks';
import { Image as ExpoImage } from 'expo-image';
import { cn } from '@/lib/utils/cn';
import type { Exercise, ThemeTokens } from '@/types';
import { THUMB_MAP } from '@/lib/utils/mediaMap';

const MAIN_CATEGORIES = [
  { id: 'CALISTHENICS', image: require('../../assets/exercises/Categories/CALISTHENICS.webp') },
  { id: 'FUNCTIONAL', image: require('../../assets/exercises/Categories/FUNCTIONAL.webp') },
  { id: 'GYM', image: require('../../assets/exercises/Categories/GYM.webp') },
  { id: 'HOME', image: require('../../assets/exercises/Categories/HOME.webp') },
];

export default function ExerciseLibraryScreen() {
  const router = useRouter();
  const t = useTheme();
  const { t: translate } = useTranslation();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const { data: exercises, isLoading } = useExercises();

  const filteredExercises = useMemo(() => {
    if (!exercises) return [];
    
    return exercises.filter((e) => {
      // 1. Search overrides everything
      if (search.trim()) {
        const term = search.toLowerCase();
        return (
          e.name_en?.toLowerCase().includes(term) ||
          e.name_es?.toLowerCase().includes(term) ||
          e.muscle_group?.toLowerCase().includes(term)
        );
      }

      // 2. Category filtering based on strict mappings
      if (activeCategory) {
        const eq = (e.equipment || '').toLowerCase();
        const cat = (e.category || '').toLowerCase();
        
        switch (activeCategory) {
          case 'CALISTHENICS':
            return eq === 'bodyweight' && cat !== 'functional';
          case 'FUNCTIONAL':
            return cat === 'functional' || e.type?.toLowerCase() === 'functional';
          case 'GYM':
            return ['barbell', 'machine', 'cable', 'smith machine', 'ez curl bar'].includes(eq) || 
                   (!['bodyweight', 'dumbbell', 'kettlebell', 'band'].includes(eq) && cat !== 'functional');
          case 'HOME':
            return ['dumbbell', 'kettlebell', 'band', 'bodyweight'].includes(eq);
          default:
            return true;
        }
      }
      
      return true;
    });
  }, [exercises, search, activeCategory]);

  const showCategoriesView = !activeCategory && !search.trim();

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: t.background }} edges={['top']}>
      <AppTopBar />
      
      <View className="px-5 pt-4 pb-2 gap-4">
        <Text className="text-5xl font-extrabold tracking-tighter leading-tight" style={{ color: t.onBackground }}>
          {translate('exercises.library') || 'LIBRARY'}
        </Text>

        <View className="flex-row items-center h-16 rounded-xl border px-4 gap-3" style={{ backgroundColor: t.surface, borderColor: t.surfaceVariant }}>
          <Text className="text-lg" style={{ color: t.onSurfaceVariant }}>⌕</Text>
          <TextInput
            className="flex-1 text-lg leading-6"
            style={{ color: t.onSurface }}
            placeholder={translate('exercises.searchPlaceholder') || "Search exercises..."}
            placeholderTextColor={t.onSurfaceVariant}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} className="p-2">
              <Text className="text-lg font-bold" style={{ color: t.onSurfaceVariant }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {activeCategory && !search.trim() && (
          <View className="flex-row items-center justify-between mt-2">
            <View className="flex-row items-center gap-2">
              <TouchableOpacity onPress={() => setActiveCategory(null)} className="w-8 h-8 rounded-full items-center justify-center border" style={{ borderColor: t.surfaceVariant, backgroundColor: t.surface }}>
                <Text style={{ color: t.onSurface }}>←</Text>
              </TouchableOpacity>
              <Text className="text-xl font-extrabold tracking-widest uppercase" style={{ color: t.primaryContainer }}>
                {activeCategory}
              </Text>
            </View>
            <Text className="text-sm font-bold tracking-widest" style={{ color: t.onSurfaceVariant }}>
              {filteredExercises.length} EXERCISES
            </Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <ActivityIndicator color={t.primaryContainer} className="mt-6" size="large" />
      ) : showCategoriesView ? (
        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120, gap: 16 }} showsVerticalScrollIndicator={false}>
          {MAIN_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              activeOpacity={0.85}
              onPress={() => setActiveCategory(cat.id)}
              className="w-full h-40 rounded-2xl overflow-hidden border relative"
              style={{ borderColor: t.surfaceVariant, backgroundColor: t.surface }}
            >
              <ExpoImage
                source={cat.image}
                style={{ width: '100%', height: '100%', opacity: 0.6 }}
                contentFit="cover"
                transition={300}
              />
              <View className="absolute inset-0 bg-black/40" />
              <View className="absolute bottom-4 left-4">
                <Text className="text-3xl font-extrabold tracking-widest uppercase" style={{ color: '#fff' }}>
                  {cat.id}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <FlatList
          className="flex-1"
          style={{ backgroundColor: t.background }}
          contentContainerStyle={{ paddingBottom: 120, paddingTop: 16 }}
          data={filteredExercises}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => <ExerciseListItem item={item} t={t} router={router} />}
          ListEmptyComponent={
            <View className="py-16 items-center">
              <Text className="text-lg leading-6" style={{ color: t.onSurfaceVariant }}>
                {translate('exercises.noResults') || "No exercises found."}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

function ExerciseListItem({ item, t, router }: { item: Exercise; t: ThemeTokens; router: Router }) {
  const { language } = useTranslation();
  
  const normalizedSlug = item.slug
    ?.toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  const localImage = normalizedSlug ? THUMB_MAP[normalizedSlug] : null;
  const imageSource = localImage 
    ? localImage 
    : (item.thumbnail_url || item.demonstration_url ? { uri: item.thumbnail_url || item.demonstration_url } : null);

  const displayName = language === 'es' && item.name_es ? item.name_es : item.name_en;

  const diffColor = React.useMemo(() => {
    switch (item.difficulty?.toLowerCase()) {
      case 'beginner':     return '#4ade80';
      case 'intermediate': return '#facc15';
      case 'advanced':     return '#f87171';
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
        {imageSource ? (
          <ExpoImage
            source={imageSource}
            style={{ width: '100%', height: '100%', opacity: 0.8 }}
            contentFit="cover"
            transition={200}
            placeholder="L35O?*0000_300~qIVD%00-;~q%M"
          />
        ) : (
          <View className="w-full h-full items-center justify-center opacity-30">
             <Text className="text-6xl">🏋️</Text>
          </View>
        )}
        <View className="absolute bottom-0 left-0 right-0 h-20 bg-black/50" />
        
        <View
          className="absolute top-4 left-4 px-3 py-1 rounded-full border"
          style={{ backgroundColor: `${t.primaryContainer}22`, borderColor: `${t.primaryContainer}44` }}
        >
          <Text className="text-[11px] font-bold tracking-widest uppercase" style={{ color: t.primaryContainer }}>
            {(item.category || 'EXERCISE').toUpperCase()}
          </Text>
        </View>

        {item.difficulty && (
          <View
            className="absolute top-4 right-4 px-3 py-1 rounded-full border"
            style={{ backgroundColor: `${diffColor}22`, borderColor: `${diffColor}44` }}
          >
            <Text className="text-[11px] font-bold tracking-widest uppercase" style={{ color: diffColor }}>
              {item.difficulty.toUpperCase()}
            </Text>
          </View>
        )}
      </View>

      <View className="flex-row justify-between items-end p-5 -mt-8 pt-8" style={{ backgroundColor: t.background }}>
        <View className="flex-1 gap-1 pr-4">
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
