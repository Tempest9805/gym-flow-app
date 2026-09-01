/**
 * Exercise detail — how to execute it, cues, and what people get wrong.
 * The ▶ is the only media: it opens the video rather than shipping images.
 */
import React from 'react';
import { View, Text, ScrollView, Pressable, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { videoUrlFor } from '@/lib/domain/video';
import { useTheme } from '@/lib/hooks/useTheme';
import { useRoutineStore } from '@/lib/store/routineStore';

function Section({ title, body }: { title: string; body: string | null }) {
  const t = useTheme();
  if (!body) return null;

  return (
    <View className="gap-1.5">
      <Text className="text-[12px] font-bold uppercase tracking-wider" style={{ color: t.primary }}>
        {title}
      </Text>
      <Text className="text-[15px] leading-6" style={{ color: t.onSurfaceVariant }}>
        {body}
      </Text>
    </View>
  );
}

export default function ExerciseDetailScreen() {
  const t = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const exercise = useRoutineStore((s) => s.exercises.find((e) => e.id === id) ?? null);

  if (!exercise) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center gap-4" style={{ backgroundColor: t.background }}>
        <Text style={{ color: t.onSurfaceVariant }}>Ese ejercicio ya no existe.</Text>
        <Pressable onPress={() => router.back()} className="px-6 justify-center" style={{ minHeight: 48 }}>
          <Text className="font-bold" style={{ color: t.primary }}>Volver</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const openVideo = () => {
    Linking.openURL(videoUrlFor(exercise)).catch(() => {
      Alert.alert('No se pudo abrir el video', 'Revisa que tengas un navegador instalado.');
    });
  };

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: t.background }} edges={['top']}>
      <View className="flex-row items-center px-2 pt-1 pb-2 gap-1">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Volver"
          className="items-center justify-center"
          style={{ width: 44, minHeight: 44 }}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={t.onSurface} />
        </Pressable>
        <Text className="flex-1 text-[13px] uppercase tracking-wider" style={{ color: t.outline }} numberOfLines={1}>
          {exercise.muscleGroup}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 20 }}>
        <View className="gap-1">
          <Text className="text-[26px] font-extrabold" style={{ color: t.onSurface }}>
            {exercise.nameEs}
          </Text>
          {exercise.nameEn && exercise.nameEn !== exercise.nameEs && (
            <Text className="text-[14px]" style={{ color: t.outline }}>
              {exercise.nameEn}
            </Text>
          )}
        </View>

        <Pressable
          onPress={openVideo}
          accessibilityRole="button"
          accessibilityLabel={`Ver video de ${exercise.nameEs}`}
          className="flex-row items-center justify-center rounded-xl gap-2"
          style={{ backgroundColor: t.primaryContainer, minHeight: 56 }}
        >
          <MaterialCommunityIcons name="play-circle-outline" size={24} color={t.onPrimaryContainer} />
          <Text className="text-base font-bold" style={{ color: t.onPrimaryContainer }}>
            {exercise.videoUrl ? 'Ver video' : 'Buscar en YouTube'}
          </Text>
        </Pressable>

        <Section title="Ejecución" body={exercise.description} />
        <Section title="Recomendaciones" body={exercise.tips} />
        <Section title="Errores comunes" body={exercise.commonMistakes} />
      </ScrollView>
    </SafeAreaView>
  );
}
