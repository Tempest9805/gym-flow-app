/**
 * Workout Detail Screen — Stitch-faithful "Ready to Train" layout:
 *   1. TopAppBar (sticky)
 *   2. Hero Section: Routine Name (display-xl) + Stats row
 *   3. Exercise List: Vertical cards with order index + name + set/rep meta
 *   4. Sticky CTA: START SESSION button (h-80, neon glow, at bottom)
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AppTopBar } from '@/components/ui/AppTopBar';
import { LoadingScreen } from '@/components/ui';
import { useTheme } from '@/lib/hooks/useTheme';
import { useRoutine } from '@/lib/hooks';
import type { RoutineWithExercises } from '@/types';

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useTheme();
  const { data: routine, isLoading } = useRoutine(id);

  if (isLoading) return <LoadingScreen />;

  if (!routine) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: t.background }} edges={['top']}>
        <AppTopBar />
        <View className="flex-1 items-center justify-center gap-4">
          <Text className="text-lg" style={{ color: t.onSurfaceVariant }}>Routine not found</Text>
          <TouchableOpacity onPress={() => router.back()} className="p-3">
            <Text className="text-base font-semibold" style={{ color: t.primaryContainer }}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const typedRoutine = routine as RoutineWithExercises;

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: t.background }} edges={['top']}>
      <AppTopBar />
      <View className="flex-1" style={{ backgroundColor: t.background }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
        >
          {/* ── 1. Hero Section ── */}
          <View className="px-5 pt-8 pb-6 gap-4">
            <View
              className="px-3 py-1 rounded-full border self-start"
              style={{
                backgroundColor: `${t.primaryContainer}22`,
                borderColor: `${t.primaryContainer}44`,
              }}
            >
              <Text className="text-[11px] font-bold tracking-[2px] uppercase" style={{ color: t.primaryContainer }}>
                READY TO TRAIN
              </Text>
            </View>
            <Text className="text-[48px] font-extrabold leading-[52px] tracking-tighter" style={{ color: t.onSurface }}>
              {typedRoutine.name.toUpperCase()}
            </Text>
            
            {/* Stats Bento */}
            <View className="flex-row gap-3 mt-2">
              <View className="flex-1 p-4 rounded-xl border gap-1" style={{ backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest }}>
                <Text className="text-[10px] font-bold tracking-widest" style={{ color: t.outline }}>MOVEMENTS</Text>
                <Text className="text-xl font-extrabold" style={{ color: t.onSurface }}>{typedRoutine.exercises?.length ?? 0}</Text>
              </View>
              <View className="flex-1 p-4 rounded-xl border gap-1" style={{ backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest }}>
                <Text className="text-[10px] font-bold tracking-widest" style={{ color: t.outline }}>EST. TIME</Text>
                <Text className="text-xl font-extrabold" style={{ color: t.onSurface }}>45m</Text>
              </View>
              <View className="flex-1 p-4 rounded-xl border gap-1" style={{ backgroundColor: t.surfaceContainer, borderColor: t.surfaceContainerHighest }}>
                <Text className="text-[10px] font-bold tracking-widest" style={{ color: t.outline }}>DIFFICULTY</Text>
                <Text className="text-xl font-extrabold" style={{ color: t.onSurface }}>HARD</Text>
              </View>
            </View>
          </View>

          {/* ── 2. Exercise List ── */}
          <View className="px-5 mt-6 gap-4">
            <Text className="text-[12px] font-bold tracking-[3px] uppercase" style={{ color: t.onSurfaceVariant }}>EXERCISE PROTOCOL</Text>
            <View className="gap-3">
              {typedRoutine.exercises?.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  className="flex-row items-center p-4 rounded-2xl border gap-4"
                  style={{
                    backgroundColor: t.surfaceContainer,
                    borderColor: t.surfaceContainerHighest,
                  }}
                  activeOpacity={0.7}
                  onPress={() => router.push(`/exercise/${item.exercise_id}`)}
                >
                  <View 
                    className="w-10 h-10 rounded-full items-center justify-center" 
                    style={{ backgroundColor: t.surfaceContainerHigh }}
                  >
                    <Text className="text-lg font-extrabold" style={{ color: t.primaryContainer }}>{index + 1}</Text>
                  </View>
                  <View className="flex-1 gap-1">
                    <Text className="text-lg font-bold" style={{ color: t.onSurface }}>
                      {item.exercise?.name_en?.toUpperCase()}
                    </Text>
                    <Text className="text-[13px] font-semibold" style={{ color: t.onSurfaceVariant }}>
                      {item.sets} SETS • {item.reps ? `${item.reps} REPS` : `${item.duration_seconds}s`}
                    </Text>
                  </View>
                  <Text className="text-xl font-light" style={{ color: t.outlineVariant }}>→</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Spacer for sticky CTA */}
          <View style={{ height: 120 }} />
        </ScrollView>

        {/* ── 3. Sticky CTA ── */}
        <View 
          className="absolute bottom-0 left-0 right-0 px-5 pt-4 pb-10 border-t" 
          style={{ backgroundColor: t.background, borderTopColor: 'rgba(255,255,255,0.05)' }}
        >
          <TouchableOpacity
            className="h-20 rounded-xl items-center justify-center shadow-2xl elevation-md"
            style={{
              backgroundColor: t.primaryContainer,
              shadowColor: t.primaryContainer,
              shadowOpacity: 0.4,
              shadowOffset: { width: 0, height: 0 },
              shadowRadius: 20,
            }}
            activeOpacity={0.85}
            onPress={() => router.push({ pathname: '/workout-session', params: { id: typedRoutine.id } })}
          >
            <Text className="text-xl font-extrabold tracking-[3px] uppercase" style={{ color: '#000' }}>START SESSION  ▶</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
