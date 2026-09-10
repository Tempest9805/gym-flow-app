/**
 * Ejercicios — the local library.
 *
 * No images: a ▶ opens the video instead, which is both lighter and more
 * useful than a still frame.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, FlatList, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import type { Exercise } from '@/lib/domain/types';
import { videoUrlFor } from '@/lib/domain/video';
import { useTheme } from '@/lib/hooks/useTheme';
import { useRoutineStore } from '@/lib/store/routineStore';

/** Lowercase, accent-insensitive, so "biceps" finds "bíceps". */
function fold(text: string): string {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export default function ExercisesScreen() {
  const t = useTheme();
  const router = useRouter();
  const exercises = useRoutineStore((s) => s.exercises);
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const needle = fold(query.trim());
    if (needle === '') return exercises;
    return exercises.filter(
      (e) =>
        fold(e.nameEs).includes(needle) ||
        fold(e.nameEn ?? '').includes(needle) ||
        fold(e.muscleGroup).includes(needle),
    );
  }, [exercises, query]);

  const openVideo = (exercise: Exercise) => {
    Linking.openURL(videoUrlFor(exercise)).catch(() => {
      Alert.alert('No se pudo abrir el video', 'Revisa que tengas un navegador instalado.');
    });
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: t.background }} edges={['top']}>
      <View className="px-4 pt-2 pb-3 gap-3">
        <Text className="text-2xl font-extrabold" style={{ color: t.onSurface }}>
          Ejercicios
        </Text>

        <View
          className="flex-row items-center rounded-xl border px-3 gap-2"
          style={{ borderColor: t.outlineVariant, backgroundColor: t.surfaceContainerLow, minHeight: 48 }}
        >
          <MaterialCommunityIcons name="magnify" size={20} color={t.onSurfaceVariant} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar ejercicio o músculo"
            placeholderTextColor={t.outline}
            className="flex-1 text-base"
            style={{ color: t.onSurface }}
            returnKeyType="search"
            accessibilityLabel="Buscar ejercicio"
          />
          {query !== '' && (
            <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityLabel="Limpiar búsqueda">
              <MaterialCommunityIcons name="close-circle" size={20} color={t.outline} />
            </Pressable>
          )}
        </View>

        <Text className="text-[12px]" style={{ color: t.outline }}>
          {results.length} de {exercises.length}
        </Text>
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 8 }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Text className="text-center mt-8" style={{ color: t.onSurfaceVariant }}>
            Ningún ejercicio coincide con «{query}».
          </Text>
        }
        renderItem={({ item }) => (
          <View
            className="flex-row items-center rounded-xl border px-2 gap-2"
            style={{ borderColor: t.outlineVariant, backgroundColor: t.surfaceContainerLow, minHeight: 60 }}
          >
            <Pressable
              onPress={() => openVideo(item)}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={`Ver video de ${item.nameEs}`}
              className="items-center justify-center"
              style={{ width: 44, minHeight: 48 }}
            >
              <MaterialCommunityIcons name="play-circle-outline" size={26} color={t.primary} />
            </Pressable>

            <Pressable
              className="flex-1 justify-center py-2"
              accessibilityRole="button"
              accessibilityLabel={`Ver detalle de ${item.nameEs}`}
              onPress={() => router.push(`/exercise/${item.id}`)}
            >
              <Text className="text-[15px] font-semibold" style={{ color: t.onSurface }} numberOfLines={1}>
                {item.nameEs}
              </Text>
              <Text className="text-[12px]" style={{ color: t.onSurfaceVariant }} numberOfLines={1}>
                {item.muscleGroup}
              </Text>
            </Pressable>

            <MaterialCommunityIcons name="chevron-right" size={22} color={t.outline} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}
