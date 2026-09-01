/**
 * Hoy — the training sheet for the selected day.
 *
 * This is the whole point of the app: open it, see the table, tick rows off.
 * Everything else is support.
 */
import React, { useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { RoutineTable } from '@/components/routine/RoutineTable';
import { DayTabs } from '@/components/routine/DayTabs';
import { TipsStrip } from '@/components/routine/TipsStrip';
import { dayProgress } from '@/lib/domain/day';
import type { RoutineRow } from '@/lib/domain/types';
import { videoUrlFor } from '@/lib/domain/video';
import { youtubeSearchUrl } from '@/lib/domain/video';
import { useTheme } from '@/lib/hooks/useTheme';
import { useActiveDay, useActiveRoutine, useRoutineStore } from '@/lib/store/routineStore';

export default function TodayScreen() {
  const t = useTheme();
  const router = useRouter();

  const routine = useActiveRoutine();
  const day = useActiveDay();
  const exercises = useRoutineStore((s) => s.exercises);
  const setActiveDay = useRoutineStore((s) => s.setActiveDay);
  const toggleRow = useRoutineStore((s) => s.toggleRow);

  const openVideo = useCallback(
    (row: RoutineRow) => {
      const exercise = exercises.find((e) => e.id === row.exerciseId);
      const url = exercise ? videoUrlFor(exercise) : youtubeSearchUrl(row.name);
      Linking.openURL(url).catch(() => {
        Alert.alert('No se pudo abrir el video', 'Revisa que tengas un navegador instalado.');
      });
    },
    [exercises],
  );

  const openTimer = useCallback(() => router.push('/tabata'), [router]);

  if (!routine || !day) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: t.background }} edges={['top']}>
        <View className="flex-1 items-center justify-center px-8 gap-4">
          <MaterialCommunityIcons name="clipboard-text-outline" size={56} color={t.outline} />
          <Text className="text-lg font-semibold text-center" style={{ color: t.onSurface }}>
            No hay ninguna rutina
          </Text>
          <Text className="text-sm text-center" style={{ color: t.onSurfaceVariant }}>
            Crea una en la pestaña Rutinas para empezar a entrenar.
          </Text>
          <Pressable
            onPress={() => router.push('/routines')}
            className="rounded-xl px-6 items-center justify-center mt-2"
            style={{ backgroundColor: t.primaryContainer, minHeight: 48 }}
          >
            <Text className="font-bold" style={{ color: t.onPrimaryContainer }}>
              Ir a Rutinas
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const { done, total } = dayProgress(day);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: t.background }} edges={['top']}>
      {/* Header — mirrors the printed sheet */}
      <View className="px-4 pt-2 pb-3">
        <View className="flex-row items-end justify-between">
          <View className="flex-1">
            <Text className="text-[11px] font-bold uppercase tracking-widest" style={{ color: t.primary }}>
              {routine.name}
            </Text>
            <Text className="text-2xl font-extrabold" style={{ color: t.onSurface }}>
              {day.focus}
            </Text>
            {(routine.goal || routine.coachName) && (
              <Text className="text-[12px] mt-0.5" style={{ color: t.onSurfaceVariant }}>
                {[routine.goal && `Objetivo: ${routine.goal}`, routine.coachName]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            )}
          </View>

          <View className="items-end">
            <Text className="text-2xl font-extrabold" style={{ color: t.primaryContainer }}>
              {done}/{total}
            </Text>
            <Text className="text-[11px] uppercase tracking-wider" style={{ color: t.outline }}>
              hechos
            </Text>
          </View>
        </View>
      </View>

      <DayTabs days={routine.days} activeDayId={day.id} onSelect={setActiveDay} />

      <ScrollView
        className="flex-1 mt-3"
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32, gap: 16 }}
      >
        <RoutineTable
          rows={day.rows}
          onToggle={(rowId) => toggleRow(day.id, rowId)}
          onOpenVideo={openVideo}
          onOpenTimer={openTimer}
        />

        <TipsStrip />
      </ScrollView>
    </SafeAreaView>
  );
}
